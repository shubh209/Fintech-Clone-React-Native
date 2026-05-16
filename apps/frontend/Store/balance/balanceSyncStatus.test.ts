import { getBalanceSyncStatusCopy } from './balanceSyncStatus';

describe('balance sync status copy', () => {
  it('maps every store sync state to visible customer-facing copy', () => {
    expect(getBalanceSyncStatusCopy('idle')).toEqual({
      label: 'Awaiting sync',
      tone: 'neutral',
    });
    expect(getBalanceSyncStatusCopy('syncing')).toEqual({
      label: 'Syncing',
      tone: 'neutral',
    });
    expect(getBalanceSyncStatusCopy('synced')).toEqual({
      label: 'Cloud synced',
      tone: 'success',
    });
    expect(getBalanceSyncStatusCopy('fallback')).toEqual({
      label: 'Offline cache',
      tone: 'warning',
    });
    expect(getBalanceSyncStatusCopy('error')).toEqual({
      label: 'Sync issue',
      tone: 'warning',
    });
  });
});
