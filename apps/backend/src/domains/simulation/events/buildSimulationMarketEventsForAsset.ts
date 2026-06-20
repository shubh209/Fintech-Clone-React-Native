import { SimulationEventSummary } from '../../../../../../packages/shared/src';
import { marketEventTemplates } from './marketEventTemplates';
import { selectMarketEventTemplateIds } from './selectMarketEventTemplateIds';

function fallbackEventId(assetSymbol: string, templateId: string) {
  return `${assetSymbol.toLowerCase()}-${templateId}`;
}

export function buildSimulationMarketEventsForAsset(assetSymbol: string): SimulationEventSummary[] {
  return selectMarketEventTemplateIds(assetSymbol).map((templateId, index) => {
    const template = marketEventTemplates[templateId];
    return {
      id: fallbackEventId(assetSymbol, template.id),
      assetSymbol,
      headline: template.headline,
      summary: template.summary,
      eventDate: template.eventDate,
      category: template.category,
      marketSentiment: template.marketSentiment,
      sortOrder: index + 1,
      sources: template.sources,
    };
  });
}
