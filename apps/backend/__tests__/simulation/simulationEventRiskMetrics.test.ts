import { calculateSimulationEventRiskMetrics } from '../../src/domains/simulation/simulationEventRiskMetrics';

function point(date: string, priceUsd: number) {
  return { date, priceUsd };
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

describe('simulation event risk metrics', () => {
  it('calculates drawdown, underwater days, and rolling 30-day returns', () => {
    const points = Array.from({ length: 61 }, (_, index) => {
      const date = addDays('2024-01-01', index);
      const priceUsd =
        index < 10
          ? 100 - index * 5
          : index < 31
            ? 55 + index
            : 86 + index * 2;

      return point(date, priceUsd);
    });

    const risk = calculateSimulationEventRiskMetrics(points, 100);

    expect(risk.startDate).toBe('2024-01-01');
    expect(risk.endDate).toBe('2024-03-01');
    expect(risk.maxDrawdownPercent).toBe(-45);
    expect(risk.longestUnderwaterDays).toBe(30);
    expect(risk.bestThirtyDayReturnPercent).toBe(198.18);
    expect(risk.worstThirtyDayReturnPercent).toBe(-15);
  });

  it('keeps underwater period open through the final point when price never recovers', () => {
    const risk = calculateSimulationEventRiskMetrics(
      [point('2024-01-01', 100), point('2024-01-15', 80), point('2024-02-01', 70)],
      100
    );

    expect(risk.longestUnderwaterDays).toBe(17);
    expect(risk.maxDrawdownPercent).toBe(-30);
  });

  it('rejects empty series or invalid starting price', () => {
    let emptySeriesError: Error | null = null;
    try {
      calculateSimulationEventRiskMetrics([], 100);
    } catch (error) {
      emptySeriesError = error as Error;
    }

    let invalidPriceError: Error | null = null;
    try {
      calculateSimulationEventRiskMetrics([point('2024-01-01', 100)], 0);
    } catch (error) {
      invalidPriceError = error as Error;
    }

    expect(emptySeriesError?.message).toBe(
      'Risk metrics require at least one positive historical point.'
    );
    expect(invalidPriceError?.message).toBe(
      'Risk metrics require at least one positive historical point.'
    );
  });
});
