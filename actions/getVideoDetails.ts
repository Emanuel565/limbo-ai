"use server";

import { google } from "googleapis";
import { VideoDetails } from "@/types/types";

const youtube = process.env.YOUTUBE_API_KEY
  ? google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  })
  : null;

async function getFallbackVideoDetails(videoId: string): Promise<VideoDetails | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      html?: string;
    };

    if (!data.title) {
      return null;
    }

    return {
      title: data.title,
      thumbnail: data.thumbnail_url || "",
      publishedAt: new Date().toISOString(),
      views: "0",
      likes: "0",
      comments: "0",
      channel: {
        title: data.author_name || "Canal desconhecido",
        thumbnail: "",
        subscribers: "0",
      },
    };
  } catch (error) {
    console.error("❌ Error fetching fallback YouTube metadata:", error);
    return null;
  }
}

export async function getVideoDetails(videoId: string) {
  console.log("🎥 Fetching video details for:", videoId);

  try {
    if (!youtube) {
      console.log("⚠️ No YouTube API key configured, using public oEmbed fallback");
      return await getFallbackVideoDetails(videoId);
    }

    const videoResponse = await youtube.videos.list({
      part: ["statistics", "snippet"],
      id: [videoId],
    });

    const videoDetails = videoResponse.data.items?.[0];

    if (!videoDetails) throw new Error("Video not found");

    const channelResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      id: [videoDetails.snippet?.channelId || ""],
      key: process.env.YOUTUBE_API_KEY,
    });

    const channelDetails = channelResponse.data.items?.[0];

    console.log("✅ Video details fetched successfully");

    const video: VideoDetails = {
      title: videoDetails.snippet?.title || "Unknown Title",
      thumbnail:
        videoDetails.snippet?.thumbnails?.maxres?.url ||
        videoDetails.snippet?.thumbnails?.high?.url ||
        videoDetails.snippet?.thumbnails?.default?.url ||
        "",
      publishedAt:
        videoDetails.snippet?.publishedAt || new Date().toISOString(),
      views: videoDetails.statistics?.viewCount || "0",
      likes: videoDetails.statistics?.likeCount || "Not Available",
      comments: videoDetails.statistics?.commentCount || "Not Available",
      channel: {
        title: videoDetails.snippet?.channelTitle || "Unknown Channel",
        thumbnail: channelDetails?.snippet?.thumbnails?.default?.url || "",
        subscribers: channelDetails?.statistics?.subscriberCount || "0",
      },
    };

    return video;
  } catch (error) {
    console.error("❌ Error fetching video details:", error);
    return await getFallbackVideoDetails(videoId);
  }
}
