CREATE TABLE IF NOT EXISTS simulation_events (
  id TEXT PRIMARY KEY,
  asset_symbol TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  event_date TEXT NOT NULL,
  category TEXT NOT NULL,
  market_sentiment TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT,
  external_id TEXT,
  confidence_score REAL,
  ingested_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_event_sources (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES simulation_events(id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_events_asset_status_sort
ON simulation_events(asset_symbol, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_simulation_event_sources_event
ON simulation_event_sources(event_id);

INSERT OR REPLACE INTO simulation_events (
  id,
  asset_symbol,
  headline,
  summary,
  event_date,
  category,
  market_sentiment,
  sort_order,
  status,
  provider,
  external_id,
  confidence_score,
  ingested_at
) VALUES
  ('btc-2020-halving', 'BTC', 'Bitcoin completes its third halving', 'Bitcoin mining rewards fell from 12.5 BTC to 6.25 BTC, reinforcing the asset''s programmed supply schedule.', '2020-05-11', 'protocol_upgrade', 'mixed', 1, 'active', 'manual', NULL, 1.0, NULL),
  ('btc-2021-tesla-bitcoin', 'BTC', 'Tesla discloses a $1.5B Bitcoin purchase', 'Tesla added Bitcoin to its treasury strategy and said it expected to accept Bitcoin payments.', '2021-02-08', 'adoption', 'positive', 2, 'active', 'manual', NULL, 1.0, NULL),
  ('btc-2021-el-salvador-legal-tender', 'BTC', 'El Salvador adopts Bitcoin as legal tender', 'El Salvador made Bitcoin legal tender, expanding national-level adoption while drawing debate over risks.', '2021-09-07', 'regulation', 'mixed', 3, 'active', 'manual', NULL, 1.0, NULL),
  ('btc-2022-ftx-bankruptcy', 'BTC', 'FTX files for bankruptcy after a liquidity crisis', 'FTX entered Chapter 11 after a rapid liquidity collapse, pressuring crypto markets and trust.', '2022-11-11', 'exchange_failure', 'negative', 4, 'active', 'manual', NULL, 1.0, NULL),
  ('btc-2024-spot-etf-approval', 'BTC', 'U.S. spot Bitcoin ETFs are approved', 'U.S. regulators approved spot Bitcoin exchange-traded products, opening a major regulated access channel.', '2024-01-10', 'adoption', 'positive', 5, 'active', 'manual', NULL, 1.0, NULL),
  ('eth-2020-beacon-chain', 'ETH', 'Ethereum Beacon Chain launches', 'Ethereum launched the Beacon Chain, starting its proof-of-stake roadmap alongside the existing mainnet.', '2020-12-01', 'protocol_upgrade', 'positive', 1, 'active', 'manual', NULL, 1.0, NULL),
  ('eth-2021-london-eip1559', 'ETH', 'Ethereum activates London and EIP-1559', 'Ethereum activated the London upgrade, adding EIP-1559 fee changes and base-fee burning.', '2021-08-05', 'protocol_upgrade', 'positive', 2, 'active', 'manual', NULL, 1.0, NULL),
  ('eth-2022-merge', 'ETH', 'Ethereum completes The Merge', 'Ethereum completed The Merge, moving mainnet consensus from proof of work to proof of stake.', '2022-09-15', 'protocol_upgrade', 'positive', 3, 'active', 'manual', NULL, 1.0, NULL),
  ('eth-2023-shapella', 'ETH', 'Ethereum activates Shapella staking withdrawals', 'Ethereum activated Shapella, enabling withdrawals for staked ETH and validator rewards.', '2023-04-12', 'protocol_upgrade', 'positive', 4, 'active', 'manual', NULL, 1.0, NULL),
  ('eth-2024-spot-etf-approval', 'ETH', 'U.S. spot Ether ETF listing applications are approved', 'U.S. regulators approved exchange rule changes for spot Ether ETF listings, advancing regulated ETH exposure.', '2024-05-23', 'adoption', 'positive', 5, 'active', 'manual', NULL, 1.0, NULL),
  ('sol-2021-private-token-sale', 'SOL', 'Solana Labs announces a $314M private token sale', 'Solana Labs raised major private funding to expand development of its high-throughput blockchain ecosystem.', '2021-06-09', 'adoption', 'positive', 1, 'active', 'manual', NULL, 1.0, NULL),
  ('sol-2021-network-outage', 'SOL', 'Solana network suffers a major outage', 'Solana experienced a major network outage, raising concerns about reliability during heavy demand.', '2021-09-14', 'crash', 'negative', 2, 'active', 'manual', NULL, 1.0, NULL),
  ('sol-2022-ftx-contagion', 'SOL', 'FTX bankruptcy hits the Solana ecosystem', 'FTX''s bankruptcy weighed on Solana because of financial and ecosystem ties to the failed exchange.', '2022-11-11', 'exchange_failure', 'negative', 3, 'active', 'manual', NULL, 1.0, NULL),
  ('sol-2023-saga-launch', 'SOL', 'Solana Mobile launches Saga', 'Solana Mobile launched Saga, testing demand for a crypto-native smartphone and mobile ecosystem.', '2023-04-13', 'ecosystem', 'mixed', 4, 'active', 'manual', NULL, 1.0, NULL),
  ('sol-2024-token-extensions', 'SOL', 'Solana launches token extensions', 'Solana launched token extensions to support richer token controls for enterprise and real-world asset use cases.', '2024-01-24', 'protocol_upgrade', 'positive', 5, 'active', 'manual', NULL, 1.0, NULL);

INSERT OR REPLACE INTO simulation_event_sources (
  id,
  event_id,
  title,
  publisher,
  url,
  published_at
) VALUES
  ('btc-2020-halving-coindesk', 'btc-2020-halving', 'Bitcoin''s Third Halving Complete: Reward Cut Surprisingly Faster Than Previous Time Estimates', 'CoinDesk', 'https://www.coindesk.com/markets/2020/05/11/bitcoins-third-halving-complete-reward-cut-surprisingly-faster-than-previous-time-estimates/', '2020-05-11'),
  ('btc-2020-halving-reuters', 'btc-2020-halving', 'Bitcoin halving keeps cryptocurrency a speculative bet', 'Reuters', 'https://www.reuters.com/article/us-crypto-currencies-bitcoin-halving-idUSKBN22N1PZ/', '2020-05-11'),
  ('btc-2021-tesla-bitcoin-sec-tesla', 'btc-2021-tesla-bitcoin', 'Tesla, Inc. Form 10-K, fiscal year ended Dec. 31, 2020', 'SEC / Tesla', 'https://www.sec.gov/Archives/edgar/data/1318605/000156459021004599/tsla-10k_20201231.htm', '2021-02-08'),
  ('btc-2021-tesla-bitcoin-axios', 'btc-2021-tesla-bitcoin', 'Tesla buys $1.5 billion in bitcoin, will start accepting the cryptocurrency as payment', 'Axios', 'https://www.axios.com/2021/02/08/tesla-bitcoin', '2021-02-08'),
  ('btc-2021-el-salvador-legal-tender-cnbc', 'btc-2021-el-salvador-legal-tender', 'El Salvador becomes first country to adopt bitcoin as legal tender', 'CNBC', 'https://www.cnbc.com/2021/09/07/el-salvador-becomes-first-country-to-adopt-bitcoin-as-legal-tender.html', '2021-09-07'),
  ('btc-2021-el-salvador-legal-tender-nytimes', 'btc-2021-el-salvador-legal-tender', 'In Global First, El Salvador Adopts Bitcoin as Currency', 'The New York Times', 'https://www.nytimes.com/2021/09/07/world/americas/el-salvador-bitcoin.html', '2021-09-07'),
  ('btc-2022-ftx-bankruptcy-prnewswire', 'btc-2022-ftx-bankruptcy', 'FTX Group Commences Voluntary Chapter 11 Proceedings in the United States', 'FTX Trading Ltd. / PR Newswire', 'https://www.prnewswire.com/news-releases/ftx-group-commences-voluntary-chapter-11-proceedings-in-the-united-states-begins-orderly-process-to-review-and-monetize-assets-for-benefit-of-global-stakeholders-301675449.html', '2022-11-11'),
  ('btc-2022-ftx-bankruptcy-reuters', 'btc-2022-ftx-bankruptcy', 'Crypto exchange FTX files for bankruptcy as wunderkind CEO exits', 'Reuters', 'https://www.reuters.com/technology/crypto-exchange-ftx-files-us-bankruptcy-protection-2022-11-11/', '2022-11-11'),
  ('btc-2024-spot-etf-approval-sec', 'btc-2024-spot-etf-approval', 'Statement on the Approval of Spot Bitcoin Exchange-Traded Products', 'SEC', 'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023', '2024-01-10'),
  ('btc-2024-spot-etf-approval-reuters', 'btc-2024-spot-etf-approval', 'SEC approves bitcoin ETFs in watershed for crypto market', 'Reuters', 'https://www.reuters.com/technology/us-sec-approves-bitcoin-etfs-watershed-crypto-market-2024-01-10/', '2024-01-10'),
  ('eth-2020-beacon-chain-ethereum-foundation', 'eth-2020-beacon-chain', 'eth2 quick update no. 21', 'Ethereum Foundation Blog', 'https://blog.ethereum.org/2020/11/27/eth2-quick-update-no-21', '2020-11-27'),
  ('eth-2020-beacon-chain-cnbc', 'eth-2020-beacon-chain', 'The world''s second-biggest cryptocurrency is getting a major upgrade', 'CNBC', 'https://www.cnbc.com/2020/12/01/ethereum-2point0-eth-cryptocurrency-launches-what-to-know.html', '2020-12-01'),
  ('eth-2021-london-eip1559-ethereum-foundation', 'eth-2021-london-eip1559', 'London Mainnet Announcement', 'Ethereum Foundation Blog', 'https://blog.ethereum.org/2021/07/15/london-mainnet-announcement', '2021-07-15'),
  ('eth-2021-london-eip1559-cnbc', 'eth-2021-london-eip1559', 'Ethereum just activated its London hard fork, and it is a really big deal', 'CNBC', 'https://www.cnbc.com/2021/08/05/ethereum-upgrade-eth-activates-london-hard-fork-eip-1559.html', '2021-08-05'),
  ('eth-2022-merge-ethereum-foundation', 'eth-2022-merge', 'Mainnet Merge Announcement', 'Ethereum Foundation Blog', 'https://blog.ethereum.org/2022/08/24/mainnet-merge-announcement', '2022-08-24'),
  ('eth-2022-merge-time', 'eth-2022-merge', 'Ethereum''s Merge Has Finally Been Completed', 'TIME', 'https://time.com/6213329/ethereum-merge-done/', '2022-09-15'),
  ('eth-2023-shapella-ethereum-foundation', 'eth-2023-shapella', 'Mainnet Shapella Announcement', 'Ethereum Foundation Blog', 'https://blog.ethereum.org/2023/03/28/shapella-mainnet-announcement', '2023-03-28'),
  ('eth-2023-shapella-coindesk', 'eth-2023-shapella', 'Ethereum''s Shanghai Upgrade Is Complete, Starting New Era of Staking Withdrawals', 'CoinDesk', 'https://www.coindesk.com/tech/2023/04/12/ethereums-shanghai-upgrade-is-complete-starting-new-era-of-staking-withdrawals/', '2023-04-12'),
  ('eth-2024-spot-etf-approval-sec', 'eth-2024-spot-etf-approval', 'Order Granting Accelerated Approval to List and Trade Shares of Ether-Based Exchange-Traded Products', 'SEC', 'https://www.sec.gov/files/rules/sro/nysearca/2024/34-100224.pdf', '2024-05-23'),
  ('eth-2024-spot-etf-approval-axios', 'eth-2024-spot-etf-approval', 'SEC approves ether ETFs, signaling change for crypto in the U.S.', 'Axios', 'https://www.axios.com/2024/05/23/sec-ethereum-etf-approval-crypto-news', '2024-05-24'),
  ('sol-2021-private-token-sale-prnewswire', 'sol-2021-private-token-sale', 'Solana Labs Completes $314.15 Million Private Token Sale Led by Andreessen Horowitz and Polychain Capital', 'Solana Labs / PR Newswire', 'https://www.prnewswire.com/news-releases/solana-labs-completes-314-15-million-private-token-sale-led-by-andreessen-horowitz-and-polychain-capital-301308662.html', '2021-06-09'),
  ('sol-2021-private-token-sale-wsj', 'sol-2021-private-token-sale', 'Crypto Startup Solana Raises $314 Million to Develop Faster Blockchain', 'The Wall Street Journal', 'https://www.wsj.com/articles/crypto-startup-solana-raises-314-million-to-develop-faster-blockchain-11623244723', '2021-06-09'),
  ('sol-2021-network-outage-solana-foundation', 'sol-2021-network-outage', 'Solana Mainnet Beta Outage Report', 'Solana Foundation', 'https://solana.com/news/9-14-network-outage-initial-overview', '2021-09-20'),
  ('sol-2021-network-outage-bloomberg', 'sol-2021-network-outage', 'What the Solana Blackout Reveals About the Fragility of Crypto', 'Bloomberg', 'https://www.bloomberg.com/news/articles/2021-09-18/what-the-solana-blackout-reveals-about-the-fragility-of-crypto', '2021-09-18'),
  ('sol-2022-ftx-contagion-solana-foundation', 'sol-2022-ftx-contagion', 'Solana Facts: FTX Bankruptcy', 'Solana Foundation', 'https://solana.org/news/solana-facts-ftx-bankruptcy', '2022-11-14'),
  ('sol-2022-ftx-contagion-bloomberg', 'sol-2022-ftx-contagion', 'FTX Latest: Solana Sell-Off Deepens; Bankman-Fried Questioned', 'Bloomberg', 'https://www.bloomberg.com/news/articles/2022-11-13/ftx-latest-solana-sell-off-deepens-bankman-fried-questioned', '2022-11-13'),
  ('sol-2023-saga-launch-techcrunch', 'sol-2023-saga-launch', 'Ring ring, Solana''s web3-focused Saga phone is calling', 'TechCrunch', 'https://techcrunch.com/2023/04/13/ring-ring-solanas-web3-focused-saga-phone-is-calling/', '2023-04-13'),
  ('sol-2023-saga-launch-fortune', 'sol-2023-saga-launch', 'The Solana Saga is here. Should you spend $1,000 on the newest crypto smartphone?', 'Fortune', 'https://fortune.com/crypto/2023/05/08/solana-saga-phone-review-anatoly-yakovenko/', '2023-05-08'),
  ('sol-2024-token-extensions-solana-foundation', 'sol-2024-token-extensions', 'Token Extensions Enable Native Support for Enterprise-Grade Use Cases', 'Solana Foundation', 'https://solana.com/news/token-extensions-on-solana', '2024-01-24'),
  ('sol-2024-token-extensions-coindesk', 'sol-2024-token-extensions', 'Solana Adds Token Extensions to Lure Stablecoin Issuers, Real-World Asset Platforms', 'CoinDesk', 'https://www.coindesk.com/tech/2024/01/24/solana-adds-token-extensions-to-lure-stablecoin-issuers-real-world-asset-platforms/', '2024-01-24');
