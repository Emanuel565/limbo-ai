import { NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { currentUser } from "@clerk/nextjs/server";
import { getVideoDetails } from "@/actions/getVideoDetails";
import fetchTranscript from "@/tools/fetchTranscript";
import { generateImage } from "@/tools/generateImage";
import { z } from "zod";
import { getVideoIdFromUrl } from "@/lib/getVideoIdFromUrl";
import generateTitle from "@/tools/generateTitle";

const defaultProvider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();

function getChatModel() {
  const provider = defaultProvider;

  if (provider === "ollama") {
    const ollama = createOpenAI({
      apiKey: "ollama",
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    });

    return ollama(process.env.OLLAMA_MODEL ?? "llama3.1");
  }

  if (provider === "openai") {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not set. Configure it or switch AI_PROVIDER to ollama.");
    }

    const openai = createOpenAI({
      apiKey: openaiApiKey,
    });

    return openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY;

  if (!claudeApiKey) {
    throw new Error("CLAUDE_API_KEY is not set. Configure it or switch AI_PROVIDER to ollama.");
  }

  const anthropic = createAnthropic({
    apiKey: claudeApiKey,
    headers: {
      "anthropic-beta": "token-efficient-tools-2025-02-19",
    },
  });

  return anthropic(process.env.CLAUDE_MODEL ?? "claude-3-7-sonnet-20250219");
}

export async function POST(req: Request) {
  const { messages, videoId } = await req.json();
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let model: any;

  try {
    model = getChatModel();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI provider configuration error";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const videoDetails = await getVideoDetails(videoId);

  const systemMessage = `You are an AI agent ready to accept questions from the user about ONE specific video. The video ID in question is ${videoId} but you'll refer to this as ${videoDetails?.title || "Selected Video"}. Use emojis to make the conversation more engaging. If an error occurs, explain it to the user and ask them to try again later. If the error suggest the user upgrade, explain that they must upgrade to use the feature, tell them to go to 'Manage Plan' in the header and upgrade. If any tool is used, analyse the response and if it contains a cache, explain that the transcript is cached because they previously transcribed the video saving the user a token - use words like database instead of cache to make it more easy to understand. Format for notion.`;

  const result = streamText({
    model,
    messages: [{ role: "system", content: systemMessage }, ...messages],
    tools: {
      fetchTranscript: fetchTranscript,
      generateTitle: generateTitle,
      generateImage: generateImage(videoId, user.id),
      getVideoDetails: tool({
        description: "Get the details of a YouTube video",
        parameters: z.object({
          videoId: z.string().describe("The video ID to get the details for"),
        }),
        execute: async ({ videoId }) => {
          const videoDetails = await getVideoDetails(videoId);
          return { videoDetails };
        },
      }),
      extractVideoId: tool({
        description: "Extract the video ID from a URL",
        parameters: z.object({
          url: z.string().describe("The URL to extract the video ID from"),
        }),
        execute: async ({ url }) => {
          const videoId = await getVideoIdFromUrl(url);
          return { videoId };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
