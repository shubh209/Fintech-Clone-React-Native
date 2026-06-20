import {
  SimulationEventCategory,
  SimulationEventMarketSentiment,
  SimulationEventSource,
} from '../../../../../../packages/shared/src';

export interface SimulationMarketEventTemplate {
  id: string;
  headline: string;
  summary: string;
  eventDate: string;
  category: SimulationEventCategory;
  marketSentiment: SimulationEventMarketSentiment;
  sources: SimulationEventSource[];
}
