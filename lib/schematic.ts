import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;

type SchematicFallbackClient = {
  track: (...args: unknown[]) => Promise<void>;
  checkFlag: (...args: unknown[]) => Promise<boolean>;
};

const noOpClient: SchematicFallbackClient = {
  track: async () => undefined,
  checkFlag: async () => false,
};

export const client: SchematicClient | SchematicFallbackClient = apiKey
  ? new SchematicClient({
      apiKey,
      cacheProviders: {
        flagChecks: [],
      },
    })
  : noOpClient;
