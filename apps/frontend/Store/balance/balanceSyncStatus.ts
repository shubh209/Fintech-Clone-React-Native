import type { BalanceSyncStatus } from './balanceStore';

export type BalanceSyncStatusTone = 'neutral' | 'success' | 'warning';

export function getBalanceSyncStatusCopy(status: BalanceSyncStatus): {
  label: string;
  tone: BalanceSyncStatusTone;
} {
  switch (status) {
    case 'syncing':
      return { label: 'Syncing', tone: 'neutral' };
    case 'synced':
      return { label: 'Cloud synced', tone: 'success' };
    case 'fallback':
      return { label: 'Offline cache', tone: 'warning' };
    case 'error':
      return { label: 'Sync issue', tone: 'warning' };
    case 'idle':
    default:
      return { label: 'Awaiting sync', tone: 'neutral' };
  }
}
