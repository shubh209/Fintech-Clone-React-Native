import { readFileSync } from 'fs';
import { join } from 'path';

const readProjectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('home UI regressions', () => {
  it('keeps the custom header safe-area padding from shrinking the search field', () => {
    const source = readProjectFile('Components/layout/CustomHeader.tsx');

    expect(source.includes('padding: top')).toBe(false);
    expect(source.includes('paddingTop: top')).toBe(true);
  });

  it('does not wire Details to the Add Money transaction action', () => {
    const source = readProjectFile('app/(authenticated)/(tabs)/home.tsx');

    expect(source.includes('const onDetails')).toBe(true);
    expect(source.includes("text={'Details'} onPress={onAddMoney}")).toBe(false);
  });

  it('toggles the More menu so repeated taps keep working', () => {
    const source = readProjectFile('Components/ui/DropDown.tsx');

    expect(source.includes('const toggleMenu')).toBe(true);
    expect(source.includes('const openMenu = () => setVisible(true);')).toBe(false);
  });
});
