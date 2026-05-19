import { readFileSync } from 'fs';
import { join } from 'path';

const readProjectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('product cleanup regressions', () => {
  it('does not expose unimplemented login methods', () => {
    const source = readProjectFile('apps/frontend/app/login.tsx');

    expect(source.includes('Continue with email')).toBe(false);
    expect(source.includes('logo-google')).toBe(false);
    expect(source.includes('logo-apple')).toBe(false);
    expect(source.includes('SignInType.Email')).toBe(false);
    expect(source.includes('SignInType.Google')).toBe(false);
    expect(source.includes('SignInType.Apple')).toBe(false);
  });

  it('does not expose fake account modal rows', () => {
    const source = readProjectFile('apps/frontend/app/(authenticated)/(modals)/account.tsx');

    expect(source.includes('>Account<')).toBe(false);
    expect(source.includes('>Learn<')).toBe(false);
    expect(source.includes('>Inbox<')).toBe(false);
  });

  it('does not expose non-functional global header controls', () => {
    const source = readProjectFile('apps/frontend/src/shared/ui/customHeader.tsx');

    expect(source.includes("placeholder='Search'")).toBe(false);
    expect(source.includes('stats-chart')).toBe(false);
    expect(source.includes('name="card"')).toBe(false);
  });
});
