import Form from "next/form";
import AnalyseButton from "./AnalyseButton";
import { analyseYoutubeVideo } from "@/actions/analyseYoutubeVideo";

function YoutubeVideoForm() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form
        action={analyseYoutubeVideo}
        className="flex flex-col sm:flex-row gap-2 items-center"
      >
        <input
          name="url"
          type="text"
          placeholder="Cole a URL do YouTube"
          className="flex-1 w-full px-4 py-3 text-slate-100 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400"
        />

        <AnalyseButton />
      </Form>
    </div>
  );
}

export default YoutubeVideoForm;
