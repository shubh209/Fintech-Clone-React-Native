export type MetricStatus = 'success' | 'error';

export interface MetricEvent {
  name: string;
  durationMs: number;
  status: MetricStatus;
  timestamp: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export type MetricMetadata = MetricEvent['metadata'];

const MAX_BUFFER_SIZE = 200;
const metricsBuffer: MetricEvent[] = [];

function now() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function createMetricEvent(event: Omit<MetricEvent, 'timestamp'>): MetricEvent {
  return {
    ...event,
    durationMs: Math.max(0, Number(event.durationMs.toFixed(2))),
    timestamp: Date.now(),
  };
}

export function recordMetric(event: Omit<MetricEvent, 'timestamp'>) {
  const metric = createMetricEvent(event);
  metricsBuffer.push(metric);

  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift();
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('[metric]', metric);
  }

  return metric;
}

export async function timeAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: MetricMetadata
) {
  const startedAt = now();

  try {
    const result = await operation();
    recordMetric({
      name,
      durationMs: now() - startedAt,
      status: 'success',
      metadata,
    });
    return result;
  } catch (error) {
    recordMetric({
      name,
      durationMs: now() - startedAt,
      status: 'error',
      metadata,
    });
    throw error;
  }
}

export function timeSync<T>(
  name: string,
  operation: () => T,
  metadata?: MetricMetadata
) {
  const startedAt = now();

  try {
    const result = operation();
    recordMetric({
      name,
      durationMs: now() - startedAt,
      status: 'success',
      metadata,
    });
    return result;
  } catch (error) {
    recordMetric({
      name,
      durationMs: now() - startedAt,
      status: 'error',
      metadata,
    });
    throw error;
  }
}

export function getMetricsSnapshot() {
  return [...metricsBuffer];
}

export function clearMetrics() {
  metricsBuffer.length = 0;
}
