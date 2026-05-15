import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('activity tab wiring', () => {
  it('uses Activity as a real primary tab instead of the Transfer placeholder', () => {
    const tabsLayout = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/_layout.tsx'),
      'utf8'
    );

    expect(existsSync(join(process.cwd(), 'app/(authenticated)/(tabs)/activity.tsx'))).toBe(true);
    expect(tabsLayout.includes('name="activity"')).toBe(true);
    expect(tabsLayout.includes("title: 'Activity'")).toBe(true);
    expect(tabsLayout.includes('name="transfer"')).toBe(false);
  });

  it('activity screen exposes search, category filters, and monthly totals', () => {
    const activitySource = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/activity.tsx'),
      'utf8'
    );

    expect(activitySource.includes('Search transactions')).toBe(true);
    expect(activitySource.includes('categoryOptions')).toBe(true);
    expect(activitySource.includes('getMonthlyTransactionSummary')).toBe(true);
  });

  it('activity screen exposes category editing controls', () => {
    const activitySource = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/activity.tsx'),
      'utf8'
    );

    expect(activitySource.includes('Edit category')).toBe(true);
    expect(activitySource.includes('Custom category')).toBe(true);
    expect(activitySource.includes('updateTransactionCategory')).toBe(true);
    expect(activitySource.includes('getTransactionCategories')).toBe(true);
  });
});
