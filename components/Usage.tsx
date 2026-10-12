"use client";

import { FeatureFlag } from "@/features/flags";
import {
  useSchematicEntitlement,
  useSchematicIsPending,
} from "@schematichq/schematic-react";
import { Progress } from "./ui/progress";

function Usage({
  featureFlag,
  title,
}: {
  featureFlag: FeatureFlag;
  title: string;
}) {
  const hasSchematicProvider = Boolean(
    process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY
  );

  if (!hasSchematicProvider) {
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

  return <UsageWithSchematic featureFlag={featureFlag} title={title} />;
}

function UsageWithSchematic({
  featureFlag,
  title,
}: {
  featureFlag: FeatureFlag;
  title: string;
}) {
  const isPending = useSchematicIsPending();
  const {
    featureAllocation,
    featureUsage,
    value: isFeatureEnabled,
  } = useSchematicEntitlement(featureFlag);

  const hasUsedAllTokens =
    featureUsage && featureAllocation && featureUsage >= featureAllocation;

  if (isPending) {
    return <div className="text-slate-300 text-center py-4">Carregando...</div>;
  }

  if (hasUsedAllTokens) {
    return (
      <div className="bg-slate-900 rounded-2xl shadow-sm border border-red-900/60 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="px-4 py-2 bg-red-950/60 rounded-lg">
            <span className="font-medium text-red-300">{featureUsage}</span>
            <span className="text-red-500 mx-2">/</span>
            <span className="font-medium text-red-300">
              {featureAllocation}
            </span>
          </div>
        </div>

        <div className="relative">
          <Progress
            value={100}
            className="h-3 rounded-full bg-slate-800 [&>*]:bg-red-500"
          />
          <p className="text-sm text-red-300 mt-2">
            Você usou todos os tokens disponíveis. Atualize seu plano para
            continuar usando este recurso.
          </p>
        </div>
      </div>
    );
  }

  if (!isFeatureEnabled) {
    return (
      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 opacity-70">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="px-4 py-2 bg-slate-800 rounded-lg">
            <span className="text-slate-300">Desativado</span>
          </div>
        </div>

        <div className="relative">
          <Progress value={0} className="h-3 rounded-full bg-slate-800" />
          <p className="text-sm text-slate-400 mt-2">
            Atualize para usar este recurso
          </p>
        </div>
      </div>
    );
  }

  const progress = ((featureUsage || 0) / (featureAllocation || 1)) * 100;

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "[&>*]:bg-red-600";
    if (percent >= 50) return "[&>*]:bg-yellow-500";
    return "[&>*]:bg-green-500";
  };

  const progressColor = getProgressColor(progress);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="px-4 py-2 bg-slate-800 rounded-lg">
          <span className="font-medium text-slate-100">{featureUsage}</span>
          <span className="text-slate-400 mx-2">/</span>
          <span className="font-medium text-slate-100">{featureAllocation}</span>
        </div>
      </div>

      <div className="relative">
        <Progress
          value={progress}
          className={`h-3 rounded-full bg-gray-100 ${progressColor}`}
        />

        {progress >= 100 ? (
          <p className="text-sm text-red-300 mt-2">
            Você atingiu o limite de uso
          </p>
        ) : progress >= 80 ? (
          <p className="text-sm text-amber-300 mt-2">
            Atenção: você está perto do limite de uso
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default Usage;
