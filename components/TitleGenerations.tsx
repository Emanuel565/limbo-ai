"use client";

import Usage from "./Usage";
import { FeatureFlag } from "@/features/flags";
import { Copy } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function TitleGenerations({ videoId }: { videoId: string }) {
  const titles = useQuery(api.titles.list, {
    videoId,
    userId: "local-user",
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  return (
    <div className="p-4 border border-slate-800 rounded-xl bg-slate-950 shadow-sm">
      <div className="min-w-52">
        <Usage featureFlag={FeatureFlag.TITLE_GENERATIONS} title="Títulos" />
      </div>

      <div className="space-y-3 mt-4 max-h-[280px] overflow-y-auto">
        {titles?.map((title) => (
          <div
            key={title._id}
            className="group relative p-4 rounded-lg border border-gray-100 bg-gray-50 hover:border-blue-100 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-slate-100 leading-relaxed">
                {title.title}
              </p>

              <button
                onClick={() => copyToClipboard(title.title)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-blue-900 rounded-md"
                title="Copiar"
              >
                <Copy className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!titles?.length && (
        <div className="text-center py-8 px-4 rounded-lg mt-4 border-2 border-dashed border-slate-700">
          <p className="text-slate-300">Ainda não há títulos gerados</p>
          <p className="text-sm text-slate-400 mt-1">
            Gere títulos para vê-los aparecer aqui
          </p>
        </div>
      )}
    </div>
  );
}

export default TitleGenerations;
