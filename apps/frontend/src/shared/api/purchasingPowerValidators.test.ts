import {
  isPurchasingPowerErrorResponse,
  isPurchasingPowerResponse,
  isPurchasingPowerSuccessResponse,
} from './purchasingPowerValidators';

const successResponse = {
  status: 'success',
  city: {
    id: 'phoenix',
    name: 'Phoenix',
    state: 'AZ',
  },
  input: {
    amountUsd: 2500,
  },
  comparisons: {
    monthlyEssentials: [
      {
        itemId: 'rent',
        label: 'Monthly rent',
        category: 'monthly_essentials',
        costUsd: 1650,
        quantity: 1.52,
        summary: '1.52x monthly rent in Phoenix',
      },
    ],
    bigPurchases: [
      {
        itemId: 'laptop',
        label: 'Laptop',
        category: 'big_purchase',
        costUsd: 1600,
        quantity: 1.56,
        summary: '1.56x laptop in Phoenix',
      },
    ],
  },
  source: {
    source: 'fallback',
    provider: 'curated_cost_of_living_dataset',
    updatedAt: '2026-06-05T00:00:00.000Z',
    reason: 'curated portfolio simulation dataset',
    isFallback: true,
    datasetVersion: '2026-06-05.v1',
  },
};

describe('purchasing power validators', () => {
  it('accepts a valid purchasing power success response', () => {
    expect(isPurchasingPowerSuccessResponse(successResponse)).toBe(true);
    expect(isPurchasingPowerResponse(successResponse)).toBe(true);
  });

  it('rejects unsupported city ids', () => {
    expect(
      isPurchasingPowerSuccessResponse({
        ...successResponse,
        city: { ...successResponse.city, id: 'los_angeles' },
      })
    ).toBe(false);
  });

  it('rejects non-positive item costs', () => {
    expect(
      isPurchasingPowerSuccessResponse({
        ...successResponse,
        comparisons: {
          ...successResponse.comparisons,
          monthlyEssentials: [
            { ...successResponse.comparisons.monthlyEssentials[0], costUsd: 0 },
          ],
        },
      })
    ).toBe(false);
  });

  it('accepts validation error responses', () => {
    expect(
      isPurchasingPowerErrorResponse({
        status: 'error',
        code: 'unsupported_city',
        message: 'City is not supported.',
      })
    ).toBe(true);
  });
});
