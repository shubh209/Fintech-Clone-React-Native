import { MMKV } from 'react-native-mmkv';
import { getInactivityStorage } from './userInactivityStorage';

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(),
}));

describe('user inactivity storage', () => {
  it('falls back to in-memory storage when MMKV cannot be created', () => {
    const MockedMMKV = MMKV as any;
    MockedMMKV.mockImplementation(() => {
      throw new Error('MMKV is unavailable without on-device JSI');
    });

    const storage = getInactivityStorage();

    expect(() => storage.set('startTime', 123)).not.toThrow();
    expect(storage.getNumber('startTime')).toBe(123);
  });
});
