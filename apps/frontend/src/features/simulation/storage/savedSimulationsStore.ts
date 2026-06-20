import * as SecureStore from 'expo-secure-store';

import {
  SimulationAssetSymbol,
  SimulationCurrentCacheStatus,
  SimulationDateResolution,
  SimulationEventDelay,
  SimulationPriceSuccessResponse,
} from '@shared/simulationTypes';

const SAVED_SIMULATIONS_KEY = 'simulation.saved.v1';

export interface SavedSimulationInput {
  asset: SimulationAssetSymbol;
  requestedDate: string;
  amountUsd: number;
  scenarioType?: 'date' | 'event';
  event?: {
    id: string;
    headline: string;
    eventDate: string;
    delay: SimulationEventDelay;
  };
}

export interface SavedSimulation {
  id: string;
  createdAt: string;
  hypotheticalLabel: 'Hypothetical simulation';
  input: SavedSimulationInput;
  resultSnapshot: SimulationPriceSuccessResponse;
  dataTrust: {
    historicalProvider: string;
    historicalDateResolution: SimulationDateResolution;
    currentProvider: string;
    currentCacheStatus: SimulationCurrentCacheStatus;
  };
}

export interface SaveSimulationParams {
  input: SavedSimulationInput;
  result: SimulationPriceSuccessResponse;
}

export interface SavedSimulationsStorageAdapter {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

interface CreateSavedSimulationsStoreOptions {
  storage?: SavedSimulationsStorageAdapter;
  createId?: () => string;
  now?: () => Date;
}

function createLocalId() {
  return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseSavedSimulations(value: string | null): SavedSimulation[] {
  if (!value) return [];

  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed : [];
}

export function createSavedSimulationsStore({
  storage = SecureStore,
  createId = createLocalId,
  now = () => new Date(),
}: CreateSavedSimulationsStoreOptions = {}) {
  async function listSavedSimulations() {
    return parseSavedSimulations(await storage.getItemAsync(SAVED_SIMULATIONS_KEY));
  }

  async function saveSimulation({ input, result }: SaveSimulationParams) {
    const existing = await listSavedSimulations();
    const saved: SavedSimulation = {
      id: createId(),
      createdAt: now().toISOString(),
      hypotheticalLabel: 'Hypothetical simulation',
      input,
      resultSnapshot: result,
      dataTrust: {
        historicalProvider: result.historical.source.provider,
        historicalDateResolution: result.historical.dateResolution,
        currentProvider: result.current.source.provider,
        currentCacheStatus: result.current.cache.status,
      },
    };

    await storage.setItemAsync(SAVED_SIMULATIONS_KEY, JSON.stringify([saved, ...existing]));
    return saved;
  }

  async function clearSavedSimulations() {
    await storage.setItemAsync(SAVED_SIMULATIONS_KEY, JSON.stringify([]));
  }

  return {
    listSavedSimulations,
    saveSimulation,
    clearSavedSimulations,
  };
}

const savedSimulationsStore = createSavedSimulationsStore();

export const listSavedSimulations = savedSimulationsStore.listSavedSimulations;
export const saveSimulation = savedSimulationsStore.saveSimulation;
export const clearSavedSimulations = savedSimulationsStore.clearSavedSimulations;
