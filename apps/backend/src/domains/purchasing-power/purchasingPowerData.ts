import {
  PurchasingPowerCity,
  PurchasingPowerCityId,
  PurchasingPowerItem,
} from '../../../../../packages/shared/src';

export const purchasingPowerDatasetVersion = '2026-06-05.v1';
export const purchasingPowerDatasetUpdatedAt = '2026-06-05T00:00:00.000Z';
const curatedSourceLabel = 'curated portfolio simulation estimate';

export const purchasingPowerCities: PurchasingPowerCity[] = [
  { id: 'phoenix', name: 'Phoenix', state: 'AZ' },
  { id: 'san_francisco', name: 'San Francisco', state: 'CA' },
  { id: 'new_york', name: 'New York', state: 'NY' },
  { id: 'austin', name: 'Austin', state: 'TX' },
  { id: 'seattle', name: 'Seattle', state: 'WA' },
];

function monthlyEssentials({
  rent,
  groceries,
  transportation,
  phoneInternet,
}: {
  rent: number;
  groceries: number;
  transportation: number;
  phoneInternet: number;
}): PurchasingPowerItem[] {
  return [
    {
      id: 'rent',
      label: 'Monthly rent',
      category: 'monthly_essentials',
      costUsd: rent,
      sourceLabel: curatedSourceLabel,
    },
    {
      id: 'groceries',
      label: 'Monthly groceries',
      category: 'monthly_essentials',
      costUsd: groceries,
      sourceLabel: curatedSourceLabel,
    },
    {
      id: 'transportation',
      label: 'Monthly transportation',
      category: 'monthly_essentials',
      costUsd: transportation,
      sourceLabel: curatedSourceLabel,
    },
    {
      id: 'phone_internet',
      label: 'Phone and internet bill',
      category: 'monthly_essentials',
      costUsd: phoneInternet,
      sourceLabel: curatedSourceLabel,
    },
  ];
}

function bigPurchases({
  carDownPayment,
  laptop,
  vacation,
}: {
  carDownPayment: number;
  laptop: number;
  vacation: number;
}): PurchasingPowerItem[] {
  return [
    {
      id: 'used_car_down_payment',
      label: 'Used car down payment',
      category: 'big_purchase',
      costUsd: carDownPayment,
      sourceLabel: curatedSourceLabel,
    },
    {
      id: 'laptop',
      label: 'Laptop',
      category: 'big_purchase',
      costUsd: laptop,
      sourceLabel: curatedSourceLabel,
    },
    {
      id: 'vacation_budget',
      label: 'Vacation flight and hotel budget',
      category: 'big_purchase',
      costUsd: vacation,
      sourceLabel: curatedSourceLabel,
    },
  ];
}

export const purchasingPowerItemsByCity: Record<
  PurchasingPowerCityId,
  PurchasingPowerItem[]
> = {
  phoenix: [
    ...monthlyEssentials({
      rent: 1650,
      groceries: 420,
      transportation: 260,
      phoneInternet: 145,
    }),
    ...bigPurchases({ carDownPayment: 3500, laptop: 1600, vacation: 2200 }),
  ],
  san_francisco: [
    ...monthlyEssentials({
      rent: 3300,
      groceries: 650,
      transportation: 320,
      phoneInternet: 170,
    }),
    ...bigPurchases({ carDownPayment: 4500, laptop: 1800, vacation: 2800 }),
  ],
  new_york: [
    ...monthlyEssentials({
      rent: 3600,
      groceries: 700,
      transportation: 250,
      phoneInternet: 165,
    }),
    ...bigPurchases({ carDownPayment: 4500, laptop: 1800, vacation: 3000 }),
  ],
  austin: [
    ...monthlyEssentials({
      rent: 1900,
      groceries: 480,
      transportation: 280,
      phoneInternet: 150,
    }),
    ...bigPurchases({ carDownPayment: 3800, laptop: 1600, vacation: 2400 }),
  ],
  seattle: [
    ...monthlyEssentials({
      rent: 2600,
      groceries: 580,
      transportation: 300,
      phoneInternet: 160,
    }),
    ...bigPurchases({ carDownPayment: 4200, laptop: 1700, vacation: 2700 }),
  ],
};
