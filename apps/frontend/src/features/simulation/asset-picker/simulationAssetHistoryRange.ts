import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';

export const MIN_SIMULATION_DATE = '2014-09-17';
export const MAX_SIMULATION_DATE = '2026-03-22';

export function getAssetHistoryStartDate(asset: SimulationAssetCatalogItem | null) {
  return asset?.historical.firstDate ?? MIN_SIMULATION_DATE;
}

export function getAssetHistoryEndDate(asset: SimulationAssetCatalogItem | null) {
  return asset?.historical.lastDate ?? MAX_SIMULATION_DATE;
}

export function getYearRange(startDate: string, endDate: string) {
  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

export function clampDateToAssetHistory({
  date,
  startDate,
  endDate,
}: {
  date: string;
  startDate: string;
  endDate: string;
}) {
  if (date < startDate) return startDate;
  if (date > endDate) return endDate;
  return date;
}
