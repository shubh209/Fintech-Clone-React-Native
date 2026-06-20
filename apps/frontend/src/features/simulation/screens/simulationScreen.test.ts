import { readFileSync } from 'fs';
import { join } from 'path';

describe('Simulation screen product boundaries', () => {
  const screenSource = () =>
    readFileSync(
      join(process.cwd(), 'apps/frontend/src/features/simulation/screens/simulationScreen.tsx'),
      'utf8'
    );
  const assetPickerSource = () =>
    [
      'apps/frontend/src/features/simulation/asset-picker/simulationAssetFilters.ts',
      'apps/frontend/src/features/simulation/asset-picker/simulationAssetSupport.ts',
    ]
      .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
      .join('\n');

  it('builds searchable selectable assets from the cloud asset catalog', () => {
    const source = screenSource();

    expect(source).toContain('getSimulationAssets');
    expect(source).toContain('selectableAssets');
    expect(source).toContain('assetCatalog.assets.ready');
    expect(source).toContain('assetCatalog.assets.unavailable');
    expect(assetPickerSource()).toContain('getRecommendedSimulationAssets');
    expect(source).toContain('filterSimulationAssets');
    expect(source.includes('const SIMULATION_ASSETS')).toBe(false);
  });

  it('opens a coin picker with search, recommendations, and filters instead of a long horizontal selector', () => {
    const source = screenSource();
    const pickerSource = assetPickerSource();

    expect(source).toContain('isAssetPickerVisible');
    expect(source).toContain('assetSearchQuery');
    expect(source).toContain('selectedAssetFilter');
    expect(source).toContain('Search coins');
    expect(pickerSource).toContain('Recommended');
    expect(pickerSource).toContain('Ready');
    expect(pickerSource).toContain('Unavailable');
    expect(pickerSource).toContain('Top 20');
    expect(source).toContain('Change');
    expect(source).toContain('Select coin');
    expect(source.includes('selectableAssets.map((item)')).toBe(false);
  });

  it('labels the workflow as hypothetical simulation output', () => {
    const source = screenSource();

    expect(source).toContain('Hypothetical simulation');
    expect(source).toContain('Data source');
    expect(source.includes('Hypothetical simulation using historical and current USD prices')).toBe(false);
  });

  it('adds city-based purchasing power comparisons after a simulation result', () => {
    const source = screenSource();

    expect(source).toContain('getPurchasingPowerComparisons');
    expect(source).toContain('selectedCity');
    expect(source).toContain('Phoenix');
    expect(source).toContain('San Francisco');
    expect(source).toContain('New York');
    expect(source).toContain('Austin');
    expect(source).toContain('Seattle');
    expect(source).toContain('Purchasing power');
    expect(source).toContain('Monthly essentials');
    expect(source).toContain('Big purchases');
    expect(source).toContain('Data estimate');
  });

  it('does not show the asset catalog summary before coin selection', () => {
    const source = screenSource();

    expect(source.includes('Asset catalog')).toBe(false);
    expect(source.includes('Ready assets')).toBe(false);
    expect(source.includes('Unavailable assets')).toBe(false);
    expect(source.includes('Market cache')).toBe(false);
    expect(source.includes('Not all catalog assets are enabled for Simulation v1.')).toBe(false);
  });

  it('shows an unavailable message only after selecting an unavailable coin', () => {
    const source = screenSource();

    const pickerSource = assetPickerSource();

    expect(pickerSource).toContain('SUPPORTED_SIMULATION_SYMBOLS');
    expect(source).toContain('getSelectedAssetAvailability');
    expect(pickerSource).toContain('Simulation supports the top 20 ready coins.');
    expect(source).toContain('selectedAssetAvailability');
    expect(source).toContain('Selected coin is unavailable');
    expect(source).toContain('selectedAssetAvailability.reason');
    expect(source).toContain('selectedAssetAvailability.detail');
    expect(source).toContain('canSelectedAssetSimulate');
  });

  it('uses a chart-inspired year explorer to guide date selection', () => {
    const source = screenSource();

    expect(source).toContain('Market Summary');
    expect(source).toContain('CartesianChart');
    expect(source).toContain('selectedYear');
    expect(source).toContain('jump by month below');
    expect(source).toContain('getSimulationHistory');
  });

  it('starts the year explorer from the selected catalog asset full-history date', () => {
    const source = screenSource();

    expect(source).toContain('selectedAssetStartDate');
    expect(source).toContain('simulationYears');
    expect(source.includes('const SIMULATION_YEARS = [2021')).toBe(false);
  });

  it('lets users press and drag on the chart to select the buy date', () => {
    const source = screenSource();

    expect(source).toContain('useChartPressState');
    expect(source).toContain('useAnimatedReaction');
    expect(source).toContain('runOnJS');
    expect(source).toContain('Select a date by pressing and dragging across the chart');
  });

  it('uses compact USD labels on the chart y-axis', () => {
    const source = screenSource();

    expect(source).toContain('formatAxisUsdLabel');
    expect(source).toContain("return `${Math.round(value / 1000)}K`");
    expect(source).toContain('formatYLabel: (value) => formatAxisUsdLabel(Number(value))');
  });

  it('adds event-based simulation mode with sourced headlines and delay options', () => {
    const source = screenSource();

    expect(source).toContain('Date');
    expect(source).toContain('Event');
    expect(source).toContain('getSimulationEvents');
    expect(source).toContain('getSimulationEventScenario');
    expect(source).toContain('Same day');
    expect(source).toContain('1 week');
    expect(source).toContain('1 month');
    expect(source).toContain('Risk journey');
    expect(source).toContain('Source');
  });

  it('renders compact saved simulation rows and opens details in a modal dialog', () => {
    const source = screenSource();

    expect(source).toContain('selectedSavedSimulation');
    expect(source).toContain('Modal');
    expect(source).toContain('onRequestClose');
    expect(source).toContain('close-outline');
    expect(source).toContain('Value invested');
    expect(source).toContain('Return');
    expect(source).toContain('Simulation details');
    expect(source).toContain('scenarioType');
    expect(source).toContain('dataTrust');
  });

  it('avoids trading product language', () => {
    const source = screenSource().toLowerCase();

    expect(/\btrading\b/.test(source)).toBe(false);
    expect(/\bbank\b/.test(source)).toBe(false);
    expect(/\border\b/.test(source)).toBe(false);
    expect(/\bportfolio\b/.test(source)).toBe(false);
    expect(/\btransaction\b/.test(source)).toBe(false);
    expect(/\breal money\b/.test(source)).toBe(false);
  });
});
