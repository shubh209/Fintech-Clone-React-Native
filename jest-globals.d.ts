declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;

declare function expect<T>(value: T): {
  any(constructor: unknown): unknown;
  not: {
    toHaveBeenCalled(): void;
    toThrow(): void;
  };
  toHaveBeenCalledWith(...expected: unknown[]): void;
  toBe(expected: unknown): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toContain(expected: unknown): void;
  toHaveLength(expected: number): void;
  toBeNull(): void;
  toEqual(expected: unknown): void;
};

declare namespace expect {
  function any(constructor: unknown): unknown;
  function objectContaining(value: unknown): unknown;
}

interface JestMock {
  (...args: unknown[]): unknown;
  mockClear(): void;
  mockImplementation(fn: (...args: unknown[]) => unknown): void;
  mockReset(): void;
  mockResolvedValue(value: unknown): JestMock;
  mockRejectedValue(value: unknown): JestMock;
}

declare const jest: {
  fn(): JestMock;
  mock(moduleName: string, factory: () => unknown): void;
  restoreAllMocks(): void;
  spyOn<T, K extends keyof T>(
    object: T,
    method: K
  ): {
    mockResolvedValue(value: unknown): JestMock;
    mockRejectedValue(value: unknown): JestMock;
  };
};
