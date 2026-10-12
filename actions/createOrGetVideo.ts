"use server";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { checkFeatureUsageLimit } from "@/lib/checkFeatureUsageLimit";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";

export interface VideoResponse {
  success: boolean;
  data?: Doc<"videos">;
  error?: string;
}

export const createOrGetVideo = async (
  videoId: string,
  userId: string = "local-user"
): Promise<VideoResponse> => {
  const resolvedUserId = userId || "local-user";

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return {
      success: true,
      data: {
        _id: `local-${videoId}`,
        _creationTime: Date.now(),
        videoId,
        userId: resolvedUserId,
      } as Doc<"videos">,
    };
  }

  const convex = getConvexClient();

  const featureCheck = await checkFeatureUsageLimit(
    resolvedUserId,
    featureFlagEvents[FeatureFlag.ANALYSE_VIDEO].event
  );

  if (!featureCheck.success) {
    return {
      success: false,
      error: featureCheck.error,
    };
  }

  try {
    const video = await convex.query(api.videos.getVideoById, {
      videoId,
      userId: resolvedUserId,
    });

    if (!video) {
      // Analyse event
      console.log(
        `🔍 Analyse event for video ${videoId} - local AI mode active, no external token purchase required`
      );

      const newVideoId = await convex.mutation(api.videos.createVideoEntry, {
        videoId,
        userId: resolvedUserId,
      });

      const newVideo = await convex.query(api.videos.getVideoById, {
        videoId: newVideoId,
        userId: resolvedUserId,
      });

      console.log("Tracking analyse video event...");
      await client.track({
        event: featureFlagEvents[FeatureFlag.ANALYSE_VIDEO].event,
        company: {
          id: resolvedUserId,
        },
        user: {
          id: resolvedUserId,
        },
      });

      return {
        success: true,
        data: newVideo!,
      };
    } else {
      console.log("Video exists - local AI mode, no extra token usage required");
      return {
        success: true,
        data: video,
      };
    }
  } catch (error) {
    console.error("Error creating or getting video:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
};
