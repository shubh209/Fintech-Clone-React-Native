export interface TickerApiPoint {
  timestamp: string | number;
  price: number;
  [key: string]: unknown;
}

export interface ChartTickerPoint {
  timestamp: number;
  price: number;
  [key: string]: number;
}

export function normalizeTickerPoints(points: TickerApiPoint[]): ChartTickerPoint[] {
  return points
    .map((point) => ({
      timestamp:
        typeof point.timestamp === 'number'
          ? point.timestamp
          : Date.parse(point.timestamp),
      price: point.price,
    }))
    .filter(
      (point) =>
        Number.isFinite(point.timestamp) &&
        Number.isFinite(point.price)
    );
}
