import { readFileSync } from 'fs';
import { join } from 'path';

describe('Simulation screen product boundaries', () => {
  const screenSource = () =>
    readFileSync(
      join(process.cwd(), 'apps/frontend/src/features/simulation/screens/simulationScreen.tsx'),
      'utf8'
    );

  it('limits selectable assets to the Simulation v1 set', () => {
    const source = screenSource();

    expect(source).toContain("symbol: 'BTC'");
    expect(source).toContain("symbol: 'ETH'");
    expect(source).toContain("symbol: 'SOL'");
    expect(source.includes("symbol: 'DOGE'")).toBe(false);
  });

  it('labels the workflow as hypothetical simulation output', () => {
    const source = screenSource();

    expect(source).toContain('Hypothetical simulation');
    expect(source).toContain('Data source');
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

  it('shows asset catalog scale without enabling unsupported simulation assets', () => {
    const source = screenSource();

    expect(source).toContain('getSimulationAssets');
    expect(source).toContain('Asset catalog');
    expect(source).toContain('Ready assets');
    expect(source).toContain('Unavailable assets');
    expect(source).toContain('Market cache');
    expect(source).toContain('Not all catalog assets are enabled for Simulation v1.');
  });

  it('uses a chart-inspired year explorer to guide date selection', () => {
    const source = screenSource();

    expect(source).toContain('Market Summary');
    expect(source).toContain('CartesianChart');
    expect(source).toContain('selectedYear');
    expect(source).toContain('jump by month below');
    expect(source).toContain('getSimulationHistory');
  });

  it('starts the year explorer from each product asset full-history date', () => {
    const source = screenSource();

    expect(source).toContain("firstDate: '2014-09-17'");
    expect(source).toContain("firstDate: '2017-11-09'");
    expect(source).toContain("firstDate: '2020-04-10'");
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
