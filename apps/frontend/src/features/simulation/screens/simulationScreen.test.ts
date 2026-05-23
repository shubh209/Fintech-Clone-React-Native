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

  it('uses a chart-inspired year explorer to guide date selection', () => {
    const source = screenSource();

    expect(source).toContain('Market Summary');
    expect(source).toContain('CartesianChart');
    expect(source).toContain('selectedYear');
    expect(source).toContain('jump by month below');
    expect(source).toContain('getSimulationHistory');
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
