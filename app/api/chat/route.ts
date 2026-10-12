import { NextResponse } from "next/server";
import { getVideoDetails } from "@/actions/getVideoDetails";

const defaultProvider = (process.env.AI_PROVIDER ?? "ollama").toLowerCase();

function getOllamaBaseUrl() {
  const raw = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  return raw.replace(/\/v1\/?$/, "");
}

function getOllamaModelCandidates() {
  const preferred = process.env.OLLAMA_MODEL ?? "llama3.2:3b-instruct";
  const fallback = process.env.OLLAMA_FALLBACK_MODEL ?? "qwen2.5:3b";

  return Array.from(new Set([preferred, fallback].filter(Boolean))) as string[];
}

async function callOllamaChat(messages: Array<{ role: string; content: string }>) {
  const ollamaUrl = `${getOllamaBaseUrl()}/api/chat`;
  let lastError: unknown;

  for (const model of getOllamaModelCandidates()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(ollamaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 220,
            top_p: 0.9,
            num_ctx: 4096,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Ollama model ${model} failed`);
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Ollama request failed");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, videoId } = body;

    if (!videoId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing videoId or messages in the request body." },
        { status: 400 }
      );
    }

    let safeVideoTitle = "Selected Video";
    try {
      const details = await getVideoDetails(videoId);
      safeVideoTitle = details?.title || safeVideoTitle;
    } catch {
      // Ignore video metadata failures and keep the local experience working.
    }

    const systemMessage = `You are an AI agent ready to accept questions from the user about ONE specific video. The video ID in question is ${videoId} but you'll refer to this as ${safeVideoTitle}. Answer in Brazilian Portuguese. Use a professional YouTube analysis style with clear headings whenever the user asks for analysis. Structure the answer with: Score de engajamento (0-100), Pontos fortes, Pontos fracos, Recomendação de melhoria. Use concise but strategic language, and keep the tone useful for creators and content strategy decisions. If an error occurs, explain it clearly and ask the user to try again later.`;

    const provider = defaultProvider;
    const requestMessages = [{ role: "system", content: systemMessage }, ...messages];

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY is not set. Configure it or switch AI_PROVIDER to ollama." },
          { status: 500 }
        );
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: requestMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || "OpenAI request failed");
      }

      const text = data?.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ text });
    }

    const data = await callOllamaChat(requestMessages);
    const text = data?.message?.content ?? data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat API failed:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
