import { readFileSync } from 'fs';
import { join } from 'path';

const readProjectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('product cleanup regressions', () => {
  it('keeps a public crypto simulator landing page with auth entry points', () => {
    const source = readProjectFile('apps/frontend/src/features/auth/screens/landingScreen.tsx');

    expect(source.includes('Crypto Market Simulator')).toBe(true);
    expect(source.includes('Sign up')).toBe(true);
    expect(source.includes('Log in')).toBe(true);
    expect(source.includes('Ready to change the way you money?')).toBe(false);
  });

  it('does not expose unimplemented login methods', () => {
    const source = readProjectFile('apps/frontend/src/features/auth/screens/loginScreen.tsx');

    expect(source.includes('Continue with email')).toBe(false);
    expect(source.includes('logo-google')).toBe(false);
    expect(source.includes('logo-apple')).toBe(false);
    expect(source.includes('SignInType.Email')).toBe(false);
    expect(source.includes('SignInType.Google')).toBe(false);
    expect(source.includes('SignInType.Apple')).toBe(false);
  });

  it('does not expose fake account modal rows', () => {
    const source = readProjectFile('apps/frontend/src/features/auth/screens/accountScreen.tsx');

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

  it('keeps signed-in account controls reachable from the crypto header', () => {
    const source = readProjectFile('apps/frontend/src/shared/ui/customHeader.tsx');

    expect(source.includes('/(authenticated)/(modals)/account')).toBe(true);
    expect(source.includes('Open account settings')).toBe(true);
  });
});
