declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;

declare function expect<T>(value: T): {
  any(constructor: unknown): unknown;
  not: {
    toThrow(): void;
  };
  toBe(expected: unknown): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toContain(expected: unknown): void;
  toBeNull(): void;
  toEqual(expected: unknown): void;
};

declare namespace expect {
  function any(constructor: unknown): unknown;
}

declare const jest: {
  fn(): unknown;
  mock(moduleName: string, factory: () => unknown): void;
  restoreAllMocks(): void;
  spyOn<T, K extends keyof T>(
    object: T,
    method: K
  ): {
    mockResolvedValue(value: unknown): void;
  };
};
