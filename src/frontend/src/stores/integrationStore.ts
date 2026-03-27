import { create } from 'zustand';
import type { IntegrationConfig, IntegrationType, IntegrationStatus, ConnectionTestResult } from '../types/integration';

interface IntegrationStore {
  configs: Record<IntegrationType, IntegrationConfig | null>;
  testResults: Record<IntegrationType, ConnectionTestResult | null>;
  testingProduct: IntegrationType | null;

  setConfig: (product: IntegrationType, config: IntegrationConfig | null) => void;
  setAllConfigs: (configs: IntegrationConfig[]) => void;
  setTestResult: (product: IntegrationType, result: ConnectionTestResult | null) => void;
  setTestingProduct: (product: IntegrationType | null) => void;
  getStatus: (product: IntegrationType) => IntegrationStatus;
  reset: () => void;
}

const DEFAULT_CONFIGS: Record<IntegrationType, IntegrationConfig | null> = {
  opentrace: null,
  openmesh: null,
  openmind: null,
  openshield: null,
};

export const useIntegrationStore = create<IntegrationStore>((set, get) => ({
  configs: { ...DEFAULT_CONFIGS },
  testResults: {
    opentrace: null,
    openmesh: null,
    openmind: null,
    openshield: null,
  },
  testingProduct: null,

  setConfig: (product, config) =>
    set((s) => ({ configs: { ...s.configs, [product]: config } })),

  setAllConfigs: (configs) => {
    const map = { ...DEFAULT_CONFIGS };
    for (const cfg of configs) {
      map[cfg.product_name] = cfg;
    }
    set({ configs: map });
  },

  setTestResult: (product, result) =>
    set((s) => ({ testResults: { ...s.testResults, [product]: result } })),

  setTestingProduct: (product) => set({ testingProduct: product }),

  getStatus: (product) => {
    const cfg = get().configs[product];
    if (!cfg || !cfg.enabled) return 'not_configured';
    return cfg.status;
  },

  reset: () =>
    set({
      configs: { ...DEFAULT_CONFIGS },
      testResults: { opentrace: null, openmesh: null, openmind: null, openshield: null },
      testingProduct: null,
    }),
}));
