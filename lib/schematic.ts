import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;

const noOpClient = {
  track: async () => undefined,
  checkFlag: async () => false,
} as any;

export const client = apiKey
  ? new SchematicClient({
      apiKey,
      cacheProviders: {
        flagChecks: [],
      },
    })
  : noOpClient;
