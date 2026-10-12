"use client";

import Usage from "./Usage";
import { FeatureFlag } from "@/features/flags";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function ThumbnailGeneration({ videoId }: { videoId: string }) {
  const images = useQuery(api.images.getImages, {
    videoId,
    userId: "local-user",
  });

  return (
    <div className="rounded-xl flex flex-col p-4 border border-slate-800 bg-slate-950">
      <div className="min-w-52">
        <Usage
          featureFlag={FeatureFlag.IMAGE_GENERATION}
          title="Geração de miniaturas"
        />
      </div>

      {/* Simple horizontal scroll for images */}
      <div className={`flex overflow-x-auto gap-4 ${images?.length && "mt-4"}`}>
        {images?.map(
          (image) =>
            image.url && (
              <div
                key={image._id}
                className="flex-none w-[200px] h-[110px] rounded-lg overflow-x-auto"
              >
                <Image
                  src={image.url}
                  alt="Imagem gerada"
                  width={200}
                  height={200}
                  className="object-cover"
                />
              </div>
            )
        )}
      </div>

      {/* No images generated yet */}
      {!images?.length && (
        <div className="text-center py-8 px-4 rounded-lg mt-4 border-2 border-dashed border-slate-700">
          <p className="text-slate-300">Ainda não há miniaturas geradas</p>
          <p className="text-sm text-slate-400 mt-1">
            Gere miniaturas para vê-las aparecer aqui
          </p>
        </div>
      )}
    </div>
  );
}

export default ThumbnailGeneration;
