import {
  clampDateToAssetHistory,
  getAssetHistoryEndDate,
  getAssetHistoryStartDate,
  getYearRange,
} from './simulationAssetHistoryRange';

describe('simulation asset history range', () => {
  it('builds chart years from the selected asset first and last imported dates', () => {
    expect(getYearRange('2020-11-12', '2023-01-12')).toEqual([2020, 2021, 2022, 2023]);
  });

  it('clamps selected dates into the selected asset history range', () => {
    expect(
      clampDateToAssetHistory({
        date: '2026-03-22',
        startDate: '2020-11-12',
        endDate: '2023-01-12',
      })
    ).toBe('2023-01-12');
  });

  it('falls back to global dates while the catalog is loading', () => {
    expect(getAssetHistoryStartDate(null)).toBe('2014-09-17');
    expect(getAssetHistoryEndDate(null)).toBe('2026-03-22');
  });
});
