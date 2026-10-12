"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { client } from "@/lib/schematic";
import { ConvexHttpClient } from "convex/browser";
import { Innertube } from "youtubei.js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface TranscriptEntry {
  text: string;
  timestamp: string;
}

const youtube = await Innertube.create({
  lang: "en",
  location: "US",
  retrieve_player: false,
});

function formatTimestamp(start_ms: number): string {
  const minutes = Math.floor(start_ms / 60000);
  const seconds = Math.floor((start_ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function fetchTranscript(videoId: string): Promise<TranscriptEntry[]> {
  try {
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    const transcript: TranscriptEntry[] =
      transcriptData.transcript.content?.body?.initial_segments.map(
        (segment) => ({
          text: segment.snippet.text ?? "N/A",
          timestamp: formatTimestamp(Number(segment.start_ms)),
        })
      ) ?? [];

    return transcript;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

export async function getYoutubeTranscript(
  videoId: string,
  userId: string = "local-user"
) {
  console.log(`🚀 Starting transcript retrieval for video ID: ${videoId}`);
  const resolvedUserId = userId || "local-user";

  console.log(
    `🔍 Checking database for existing transcript for video: ${videoId}`
  );
  const existingTranscript = await convex.query(
    api.transcript.getTranscriptByVideoId,
    { videoId, userId: resolvedUserId }
  );

  if (existingTranscript) {
    console.log(`✅ Transcript found in database for video: ${videoId}`);
    console.log(
      `📊 Transcript length: ${existingTranscript.transcript.length} segments`
    );
    return {
      cache:
        "This video has already been transcribed - Accessing cached transcript instead of using a token",
      transcript: existingTranscript.transcript,
    };
  }

  console.log(
    `🔄 No existing transcript found. Fetching new transcript from YouTube...`
  );
  try {
    console.log(`📥 Calling YouTube API for video: ${videoId}`);
    const transcript = await fetchTranscript(videoId);
    console.log(
      `📝 Successfully retrieved transcript with ${transcript.length} segments`
    );

    console.log(`💾 Storing transcript in database...`);
    // Store transcript in database
    await convex.mutation(api.transcript.storeTranscript, {
      videoId,
      userId: resolvedUserId,
      transcript,
    });
    console.log(`✅ Transcript successfully stored in database`);

    console.log(`📊 Tracking transcription event with Schematic`);
    await client.track({
      event: featureFlagEvents[FeatureFlag.TRANSCRIPTION].event,
      company: {
        id: resolvedUserId,
      },
      user: {
        id: resolvedUserId,
      },
    });
    console.log(`✅ Event tracking complete`);

    return {
      transcript,
      cache:
        "This video was transcribed using a token, the transcript is now saved in the database",
    };
  } catch (error) {
    console.error("❌ Error fetching transcript:", error);
    console.log(`⚠️ Returning empty transcript due to error`);
    return {
      transcript: [],
      cache: "Error fetching transcript, please try again later",
    };
  }
}
