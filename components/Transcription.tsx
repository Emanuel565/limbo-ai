"use client";

import { FeatureFlag } from "@/features/flags";
import { useEffect, useState } from "react";
import Usage from "./Usage";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";

interface TranscriptEntry {
  text: string;
  timestamp: string;
}

function Transcription({ videoId }: { videoId: string }) {
  const [transcript, setTranscript] = useState<{
    transcript: TranscriptEntry[];
    cache: string;
  } | null>(null);

  useEffect(() => {
    const loadTranscript = async () => {
      const result = await getYoutubeTranscript(videoId);
      setTranscript(result);
    };

    loadTranscript();
  }, [videoId]);

  return (
    <div className="border border-slate-800 bg-slate-950 p-4 pb-0 rounded-xl gap-4 flex flex-col">
      <Usage featureFlag={FeatureFlag.TRANSCRIPTION} title="Transcrição" />

      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto rounded-md p-4 bg-slate-900/60">
        {transcript ? (
          transcript.transcript.map((entry, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-sm text-slate-400 min-w-[50px]">
                {entry.timestamp}
              </span>
              <p className="text-sm text-slate-200">{entry.text}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">Nenhuma transcrição disponível</p>
        )}
      </div>
    </div>
  );
}

export default Transcription;
