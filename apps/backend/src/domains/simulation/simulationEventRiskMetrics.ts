import { SimulationEventRiskMetrics } from '../../../../../packages/shared/src';

interface RiskPoint {
  date: string;
  priceUsd: number;
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function daysBetween(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function assertUsablePoint(point: RiskPoint) {
  if (!Number.isFinite(point.priceUsd) || point.priceUsd <= 0) {
    throw new Error('Risk metrics require positive historical prices.');
  }
}

export function calculateSimulationEventRiskMetrics(
  points: RiskPoint[],
  initialPriceUsd: number
): SimulationEventRiskMetrics {
  if (points.length === 0 || !Number.isFinite(initialPriceUsd) || initialPriceUsd <= 0) {
    throw new Error('Risk metrics require at least one positive historical point.');
  }

  points.forEach(assertUsablePoint);

  let peak = points[0].priceUsd;
  let maxDrawdownPercent = 0;
  let currentUnderwaterStart: string | null = null;
  let longestUnderwaterDays = 0;
  let bestThirtyDayReturnPercent = 0;
  let worstThirtyDayReturnPercent = 0;

  for (const point of points) {
    peak = Math.max(peak, point.priceUsd);
    const drawdown = ((point.priceUsd - peak) / peak) * 100;
    maxDrawdownPercent = Math.min(maxDrawdownPercent, drawdown);

    if (point.priceUsd < initialPriceUsd && currentUnderwaterStart === null) {
      currentUnderwaterStart = point.date;
    }

    if (point.priceUsd >= initialPriceUsd && currentUnderwaterStart !== null) {
      longestUnderwaterDays = Math.max(
        longestUnderwaterDays,
        daysBetween(currentUnderwaterStart, point.date)
      );
      currentUnderwaterStart = null;
    }
  }

  if (currentUnderwaterStart !== null) {
    longestUnderwaterDays = Math.max(
      longestUnderwaterDays,
      daysBetween(currentUnderwaterStart, points[points.length - 1].date)
    );
  }

  for (let startIndex = 0; startIndex < points.length; startIndex += 1) {
    const start = points[startIndex];
    const targetEndDate = new Date(`${start.date}T00:00:00.000Z`);
    targetEndDate.setUTCDate(targetEndDate.getUTCDate() + 30);
    const endDateText = targetEndDate.toISOString().slice(0, 10);
    const end = points.find((point) => point.date >= endDateText);

    if (!end) continue;

    const returnPercent = ((end.priceUsd - start.priceUsd) / start.priceUsd) * 100;
    bestThirtyDayReturnPercent = Math.max(bestThirtyDayReturnPercent, returnPercent);
    worstThirtyDayReturnPercent = Math.min(worstThirtyDayReturnPercent, returnPercent);
  }

  return {
    maxDrawdownPercent: roundPercent(maxDrawdownPercent),
    longestUnderwaterDays,
    bestThirtyDayReturnPercent: roundPercent(bestThirtyDayReturnPercent),
    worstThirtyDayReturnPercent: roundPercent(worstThirtyDayReturnPercent),
    startDate: points[0].date,
    endDate: points[points.length - 1].date,
  };
}
