import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { timeAsync } from '@/shared/metrics/metrics';
import { isPurchasingPowerResponse } from '@/shared/api/purchasingPowerValidators';
import {
  PurchasingPowerCityId,
  PurchasingPowerResponse,
} from '@shared/purchasingPowerTypes';

export interface GetPurchasingPowerComparisonsParams {
  city: PurchasingPowerCityId;
  amountUsd: number;
}

export async function getPurchasingPowerComparisons({
  city,
  amountUsd,
}: GetPurchasingPowerComparisonsParams): Promise<PurchasingPowerResponse> {
  const query = new URLSearchParams({
    city,
    amountUsd: String(amountUsd),
  });

  return timeAsync(
    'crypto.client.purchasing_power.fetch',
    async () => {
      const response = await fetch(
        getCryptoApiUrl(`/api/purchasing-power/comparisons?${query.toString()}`)
      );
      const payload = await response.json();

      if (!isPurchasingPowerResponse(payload)) {
        throw new Error('Invalid purchasing power response from cloud API');
      }

      return payload;
    },
    {
      city,
    }
  );
}
