const legacyCycleTemplateIds = [
  'covidLiquidityShock',
  'chinaMiningCrackdown',
  'marketCyclePeak',
  'terraCollapse',
  'ftxBankruptcy',
];

const post2021TemplateIds = [
  'marketCyclePeak',
  'terraCollapse',
  'ethereumMerge',
  'ftxBankruptcy',
  'usdcDepeg',
];

const post2022TemplateIds = [
  'ethereumMerge',
  'ftxBankruptcy',
  'usdcDepeg',
  'bitcoinEtfApproval',
  'bitcoinHalving2024',
];

const shortEndedTemplateIds = [
  'chinaMiningCrackdown',
  'marketCyclePeak',
  'terraCollapse',
  'ethereumMerge',
  'ftxBankruptcy',
];

export function selectMarketEventTemplateIds(assetSymbol: string) {
  if (assetSymbol === 'USDS' || assetSymbol === 'CC') return shortEndedTemplateIds;
  if (assetSymbol === 'RAIN') return post2021TemplateIds;
  if (assetSymbol === 'WBT') return post2022TemplateIds;
  return legacyCycleTemplateIds;
}
