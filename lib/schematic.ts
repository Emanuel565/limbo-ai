type SchematicFallbackClient = {
  track: (...args: unknown[]) => Promise<void>;
  checkFlag: (...args: unknown[]) => Promise<boolean>;
  entitlements: {
    getFeatureUsageByCompany: (...args: unknown[]) => Promise<{
      data: {
        features: Array<{
          feature?: { eventSubtype?: string };
          usage?: number;
          allocation?: number;
        }>;
      };
    }>;
  };
};

const noOpClient: SchematicFallbackClient = {
  track: async () => undefined,
  checkFlag: async () => false,
  entitlements: {
    getFeatureUsageByCompany: async () => ({
      data: { features: [] },
    }),
  },
};

export const client: SchematicFallbackClient = noOpClient;
