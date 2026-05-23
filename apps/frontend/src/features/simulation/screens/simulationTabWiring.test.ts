import { readFileSync } from 'fs';
import { join } from 'path';

describe('Simulation tab wiring', () => {
  it('adds a signed-in Simulation tab while keeping Crypto available', () => {
    const tabLayout = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/(tabs)/_layout.tsx'),
      'utf8'
    );

    expect(tabLayout).toContain('name="simulation"');
    expect(tabLayout).toContain("title: 'Simulation'");
    expect(tabLayout).toContain('name="crypto"');
  });

  it('routes the Simulation tab to the Simulation screen', () => {
    const routeSource = readFileSync(
      join(process.cwd(), 'apps/frontend/app/(authenticated)/(tabs)/simulation.tsx'),
      'utf8'
    );

    expect(routeSource).toContain(
      "export { default } from '@/features/simulation/screens/simulationScreen'"
    );
  });
});
