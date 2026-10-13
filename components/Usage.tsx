"use client";

import { FeatureFlag } from "@/features/flags";
import { Progress } from "./ui/progress";

function Usage({
  featureFlag,
  title,
}: {
  featureFlag: FeatureFlag;
  title: string;
}) {
  void featureFlag;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="px-4 py-2 bg-slate-800 rounded-lg">
          <span className="font-medium text-slate-100">0</span>
          <span className="text-slate-400 mx-2">/</span>
          <span className="font-medium text-slate-100">∞</span>
        </div>
      </div>

      <div className="relative">
        <Progress value={0} className="h-3 rounded-full bg-slate-800" />
      </div>
    </div>
  );
}

export default Usage;
