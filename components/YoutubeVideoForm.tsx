"use client";

import { getVideoIdFromUrl } from "@/lib/getVideoIdFromUrl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AnalyseButton from "./AnalyseButton";
import { Search } from "lucide-react";

function YoutubeVideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = url.trim();
    const videoId = getVideoIdFromUrl(trimmedUrl);

    if (!trimmedUrl || !videoId) {
      window.alert("Cole uma URL válida do YouTube para analisar.");
      return;
    }

    setPending(true);
    router.push(`/video/${videoId}/analysis`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 items-stretch"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e8d9c6]/70" />
          <input
            name="url"
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full pl-11 pr-4 py-3.5 text-sm text-slate-100 bg-black/50 border border-[#e8d9c6]/25 rounded-full focus:outline-none focus:border-[#e8d9c6] transition-all duration-200 placeholder:text-slate-500 font-sans"
          />
        </div>

        <AnalyseButton pending={pending} />
      </form>
    </div>
  );
}

export default YoutubeVideoForm;
