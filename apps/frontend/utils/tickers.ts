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
    .map((point) => {
      const normalizedPoint: ChartTickerPoint = {
        timestamp:
        typeof point.timestamp === 'number'
          ? point.timestamp
          : Date.parse(point.timestamp),
        price: point.price,
      };

      Object.entries(point).forEach(([key, value]) => {
        if (key !== 'timestamp' && key !== 'price' && typeof value === 'number') {
          normalizedPoint[key] = value;
        }
      });

      return normalizedPoint;
    })
    .filter(
      (point) =>
        Number.isFinite(point.timestamp) &&
        Number.isFinite(point.price)
    );
}
