export interface MetricPayload {
  name: string;
  durationMs: number;
  status: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

const MAX_BUFFER_SIZE = 200;
const metricsBuffer: MetricPayload[] = [];

export function recordMetric(metric: MetricPayload) {
  metricsBuffer.push(metric);

  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift();
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return;
  }

  if (typeof console !== 'undefined') {
    console.log(`[metric] ${metric.name}`, metric);
  }
}

export function getMetricsSnapshot() {
  return [...metricsBuffer];
}

export function clearMetrics() {
  metricsBuffer.length = 0;
}

export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    recordMetric({ name, durationMs: Date.now() - start, status: 'success', metadata });
    return result;
  } catch (error) {
    recordMetric({ name, durationMs: Date.now() - start, status: 'error', metadata });
    throw error;
  }
}
