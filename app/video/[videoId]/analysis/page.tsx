"use client";

import { createOrGetVideo } from "@/actions/createOrGetVideo";
import AiAgentChat from "@/components/AiAgentChat";
import ThumbnailGeneration from "@/components/ThumbnailGeneration";
import TitleGenerations from "@/components/TitleGenerations";
import Transcription from "@/components/Transcription";
import Usage from "@/components/Usage";
import YoutubeVideoDetails from "@/components/YoutubeVideoDetails";
import { Doc } from "@/convex/_generated/dataModel";
import { FeatureFlag } from "@/features/flags";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function AnalysisPage() {
  const params = useParams<{ videoId: string }>();
  const { videoId } = params;
  const [video, setVideo] = useState<Doc<"videos"> | null | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchVideo = async () => {
      const response = await createOrGetVideo(videoId as string, "local-user");
      if (!response.success) {
        // toast.error("Error creating or getting video", {
        //   description: response.error,
        //   duration: 10000,
        // });
      } else {
        setVideo(response.data!);
      }
    };

    fetchVideo();
  }, [videoId]);

  const VideoTranscriptionStatus =
    video === undefined ? (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-full">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
        <span className="text-sm text-slate-300">Carregando...</span>
      </div>
    ) : !video ? (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-950/60 border border-amber-700 rounded-full">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        <p className="text-sm text-amber-200">
          Você está no Limbo. Validação local ativa: a IA processa no seu
          ambiente e não consome tokens externos. <br />
          <span className="font-semibold">
            O processamento acontece no seu ambiente local.
          </span>
        </p>
      </div>
    ) : (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-700 rounded-full">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <p className="text-sm text-emerald-200">
          Você está no Limbo. Validação local confirmada: a IA continua usando
          processamento local, sem tokens extras em chamadas futuras. <br />
        </p>
      </div>
    );

  return (
    <div className="xl:container mx-auto px-4 md:px-0 bg-slate-950 text-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="order-2 lg:order-1 flex flex-col gap-4 bg-slate-950 lg:border-r border-slate-800 p-6">
          <div className="flex flex-col gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/60">
            <Usage
              featureFlag={FeatureFlag.ANALYSE_VIDEO}
              title="Analisar vídeo"
            />

            {/* Video Transcription status */}
            {VideoTranscriptionStatus}
          </div>

          {/* Youtube video details */}
          <YoutubeVideoDetails videoId={videoId} />

          {/* Thumbnail Generation */}
          <ThumbnailGeneration videoId={videoId} />

          {/* Title Generation */}
          <TitleGenerations videoId={videoId} />

          {/* Transcription */}
          <Transcription videoId={videoId} />
        </div>

        {/* Right Side */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20 h-[500px] md:h-[calc(100vh-6rem)]">
          {/* Ai Agent Chat Section */}
          <AiAgentChat videoId={videoId} />
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;
