import { SimulationMarketEventTemplate } from './simulationEventTemplateTypes';

export const marketEventTemplates: Record<string, SimulationMarketEventTemplate> = {
  covidLiquidityShock: {
    id: '2020-covid-liquidity-shock',
    headline: 'Crypto sells off during the COVID liquidity shock',
    summary: 'Global markets sold off sharply as COVID uncertainty drove investors toward cash.',
    eventDate: '2020-03-12',
    category: 'crash',
    marketSentiment: 'negative',
    sources: [
      {
        title: 'Bitcoin Plunges in Biggest Intraday Drop Since 2013',
        publisher: 'Bloomberg',
        url: 'https://www.bloomberg.com/news/articles/2020-03-12/bitcoin-plunges-in-biggest-intraday-drop-since-2013',
        publishedAt: '2020-03-12',
      },
      {
        title: 'Bitcoin suffers worst day in seven years',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/article/us-crypto-currencies-idUSKBN20Z3H0/',
        publishedAt: '2020-03-13',
      },
    ],
  },
  chinaMiningCrackdown: {
    id: '2021-china-mining-crackdown',
    headline: 'China expands its crypto mining crackdown',
    summary: 'China intensified restrictions on crypto mining and trading, pressuring market liquidity.',
    eventDate: '2021-05-21',
    category: 'regulation',
    marketSentiment: 'negative',
    sources: [
      {
        title: 'China cracks down on bitcoin mining, trading activities',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/technology/china-cracks-down-bitcoin-mining-trading-activities-2021-05-21/',
        publishedAt: '2021-05-21',
      },
      {
        title: 'China intensifies crypto mining crackdown',
        publisher: 'CNBC',
        url: 'https://www.cnbc.com/2021/05/21/china-crypto-crackdown-bitcoin-mining-trading.html',
        publishedAt: '2021-05-21',
      },
    ],
  },
  marketCyclePeak: {
    id: '2021-market-cycle-peak',
    headline: 'Crypto market reaches a late-2021 cycle peak',
    summary: 'Major crypto assets traded near cycle highs before risk appetite faded into 2022.',
    eventDate: '2021-11-10',
    category: 'ecosystem',
    marketSentiment: 'mixed',
    sources: [
      {
        title: 'Bitcoin hits record high after inflation data',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/markets/currencies/bitcoin-hits-record-high-after-inflation-data-2021-11-10/',
        publishedAt: '2021-11-10',
      },
      {
        title: 'Bitcoin, Ether Hit All-Time Highs',
        publisher: 'CoinDesk',
        url: 'https://www.coindesk.com/markets/2021/11/10/bitcoin-ether-hit-all-time-highs/',
        publishedAt: '2021-11-10',
      },
    ],
  },
  terraCollapse: {
    id: '2022-terra-collapse',
    headline: 'TerraUSD collapse triggers crypto market stress',
    summary: 'The Terra stablecoin collapse created broad contagion concerns across crypto markets.',
    eventDate: '2022-05-12',
    category: 'crash',
    marketSentiment: 'negative',
    sources: [
      {
        title: 'Cryptocurrencies tumble as stablecoin TerraUSD collapses',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/technology/cryptocurrencies-tumble-stablecoin-terrausd-collapses-2022-05-12/',
        publishedAt: '2022-05-12',
      },
      {
        title: 'Terra Blockchain Halted Again as Validators Plot Next Steps',
        publisher: 'CoinDesk',
        url: 'https://www.coindesk.com/tech/2022/05/12/terra-blockchain-halted/',
        publishedAt: '2022-05-12',
      },
    ],
  },
  ethereumMerge: {
    id: '2022-ethereum-merge',
    headline: 'Ethereum completes The Merge',
    summary: 'Ethereum moved mainnet consensus from proof of work to proof of stake.',
    eventDate: '2022-09-15',
    category: 'protocol_upgrade',
    marketSentiment: 'positive',
    sources: [
      {
        title: 'Mainnet Merge Announcement',
        publisher: 'Ethereum Foundation Blog',
        url: 'https://blog.ethereum.org/2022/08/24/mainnet-merge-announcement',
        publishedAt: '2022-08-24',
      },
      {
        title: 'Ethereum completes long-awaited energy-saving Merge',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/technology/ethereum-blockchain-completes-major-software-upgrade-2022-09-15/',
        publishedAt: '2022-09-15',
      },
    ],
  },
  ftxBankruptcy: {
    id: '2022-ftx-bankruptcy',
    headline: 'FTX files for bankruptcy after a liquidity crisis',
    summary: 'FTX entered Chapter 11 after a rapid liquidity collapse, damaging trust across crypto markets.',
    eventDate: '2022-11-11',
    category: 'exchange_failure',
    marketSentiment: 'negative',
    sources: [
      {
        title: 'FTX Group Commences Voluntary Chapter 11 Proceedings in the United States',
        publisher: 'FTX Trading Ltd. / PR Newswire',
        url: 'https://www.prnewswire.com/news-releases/ftx-group-commences-voluntary-chapter-11-proceedings-in-the-united-states-begins-orderly-process-to-review-and-monetize-assets-for-benefit-of-global-stakeholders-301675449.html',
        publishedAt: '2022-11-11',
      },
      {
        title: 'Crypto exchange FTX files for bankruptcy as CEO exits',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/technology/crypto-exchange-ftx-files-us-bankruptcy-protection-2022-11-11/',
        publishedAt: '2022-11-11',
      },
    ],
  },
  usdcDepeg: {
    id: '2023-usdc-depeg',
    headline: 'USDC temporarily depegs during U.S. banking stress',
    summary: 'USDC fell below one dollar after Circle disclosed reserves at Silicon Valley Bank.',
    eventDate: '2023-03-11',
    category: 'ecosystem',
    marketSentiment: 'negative',
    sources: [
      {
        title: 'Stablecoin USDC breaks dollar peg after firm reveals Silicon Valley Bank exposure',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/markets/currencies/stablecoin-usdc-breaks-dollar-peg-after-firm-reveals-silicon-valley-bank-exposure-2023-03-11/',
        publishedAt: '2023-03-11',
      },
      {
        title: 'USDC Stablecoin Depegs, Crypto Market Goes Haywire After Silicon Valley Bank Collapse',
        publisher: 'CoinDesk',
        url: 'https://www.coindesk.com/markets/2023/03/11/usdc-stablecoin-depegs-crypto-market-goes-haywire-after-silicon-valley-bank-collapse/',
        publishedAt: '2023-03-11',
      },
    ],
  },
  bitcoinEtfApproval: {
    id: '2024-spot-bitcoin-etf-approval',
    headline: 'U.S. spot Bitcoin ETFs are approved',
    summary: 'U.S. regulators approved spot Bitcoin exchange-traded products, opening a major regulated access channel.',
    eventDate: '2024-01-10',
    category: 'adoption',
    marketSentiment: 'positive',
    sources: [
      {
        title: 'Statement on the Approval of Spot Bitcoin Exchange-Traded Products',
        publisher: 'SEC',
        url: 'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023',
        publishedAt: '2024-01-10',
      },
      {
        title: 'SEC approves bitcoin ETFs in watershed for crypto market',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/technology/us-sec-approves-bitcoin-etfs-watershed-crypto-market-2024-01-10/',
        publishedAt: '2024-01-10',
      },
    ],
  },
  bitcoinHalving2024: {
    id: '2024-bitcoin-halving',
    headline: 'Bitcoin completes its fourth halving',
    summary: 'Bitcoin mining rewards fell from 6.25 BTC to 3.125 BTC, renewing attention on programmed supply.',
    eventDate: '2024-04-20',
    category: 'protocol_upgrade',
    marketSentiment: 'mixed',
    sources: [
      {
        title: 'Bitcoin completes fourth-ever halving',
        publisher: 'CoinDesk',
        url: 'https://www.coindesk.com/markets/2024/04/20/bitcoin-completes-fourth-ever-halving/',
        publishedAt: '2024-04-20',
      },
      {
        title: 'Bitcoin halving: cryptocurrency mining reward is cut in half',
        publisher: 'Reuters',
        url: 'https://www.reuters.com/technology/bitcoin-halving-cryptocurrency-mining-reward-is-cut-half-2024-04-20/',
        publishedAt: '2024-04-20',
      },
    ],
  },
};
