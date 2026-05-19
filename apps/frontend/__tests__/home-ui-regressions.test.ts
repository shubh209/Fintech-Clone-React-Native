import { readFileSync } from 'fs';
import { join } from 'path';

const readProjectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('home product cleanup regressions', () => {
  it('keeps the custom header safe-area padding', () => {
    const source = readProjectFile('apps/frontend/Components/layout/CustomHeader.tsx');

    expect(source.includes('padding: top')).toBe(false);
    expect(source.includes('paddingTop: top')).toBe(true);
  });

  it('does not expose random or destructive money actions', () => {
    const source = readProjectFile('apps/frontend/app/(authenticated)/(tabs)/home.tsx');

    expect(source.includes("text={'Add Money'}")).toBe(false);
    expect(source.includes("text={'Exchange'}")).toBe(false);
    expect(source.includes('Math.random')).toBe(false);
    expect(source.includes('clearTansactions')).toBe(false);
  });

  it('does not render the fake More menu or static widgets', () => {
    const source = readProjectFile('apps/frontend/app/(authenticated)/(tabs)/home.tsx');

    expect(source.includes('<DropDown')).toBe(false);
    expect(source.includes('<WidgetList')).toBe(false);
    expect(source.includes('Widgets')).toBe(false);
  });

  it('keeps Details wired to Activity', () => {
    const source = readProjectFile('apps/frontend/app/(authenticated)/(tabs)/home.tsx');

    expect(source).toContain("text={'Details'}");
    expect(source).toContain("router.push('/(authenticated)/(tabs)/activity'");
  });

  it('shows the transaction cloud sync state on the Home screen', () => {
    const source = readProjectFile('apps/frontend/app/(authenticated)/(tabs)/home.tsx');

    expect(source.includes('getBalanceSyncStatusCopy')).toBe(true);
    expect(source.includes('syncStatus')).toBe(true);
  });
});
