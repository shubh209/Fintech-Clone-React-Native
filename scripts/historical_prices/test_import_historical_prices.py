import csv
import sys
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from import_historical_prices import build_import


HEADER = ["Date", "Open", "High", "Low", "Close", "Volume", "Daily_Return", "High_Low_Spread", "SMA_7", "SMA_30"]


def csv_rows(dates):
    rows = [HEADER]
    for index, value in enumerate(dates):
        rows.append([f"{value} 00:00:00+00:00", 10, 12, 9, 11, 1000, "" if index == 0 else 1, 3, 10, 10])
    return rows


class HistoricalPriceImportTests(unittest.TestCase):
    def make_source(self, directory_rows=None, files=None):
        root = Path(tempfile.mkdtemp(prefix="historical-prices-"))
        top100 = root / "crypto_top100"
        top100.mkdir()
        directory_rows = directory_rows or [
            [1, "bitcoin", "bitcoin_BTC.csv"],
            [2, "ethereum", "ethereum_ETH.csv"],
            [3, "solana", "solana_SOL.csv"],
            [4, "dogecoin", "dogecoin_DOGE.csv"],
        ]
        with (root / "crypto_directory.csv").open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["Index", "Crypto Name", "File Name"])
            writer.writerows(directory_rows)
        files = files or {
            "bitcoin_BTC.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
            "ethereum_ETH.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
            "solana_SOL.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
            "dogecoin_DOGE.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
        }
        for file_name, rows in files.items():
            with (top100 / file_name).open("w", newline="", encoding="utf-8") as handle:
                csv.writer(handle).writerows(rows)
        return root

    def build(self, root, end_date=date(2021, 1, 4)):
        return build_import(
            source_root=root,
            source_name="Top 100 Cryptocurrency Historical Prices",
            source_url="https://example.test/dataset",
            source_version="2026-05-22",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=end_date,
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
        )

    def test_imports_every_valid_asset(self):
        result = self.build(self.make_source())
        self.assertEqual(result.imported_assets, ["BTC", "DOGE", "ETH", "SOL"])
        self.assertEqual(result.imported_row_count, 16)

    def test_fails_when_product_asset_is_missing(self):
        root = self.make_source(directory_rows=[[1, "bitcoin", "bitcoin_BTC.csv"], [2, "ethereum", "ethereum_ETH.csv"]])
        with self.assertRaisesRegex(ValueError, "Missing required product asset"):
            self.build(root)

    def test_skips_malformed_non_product_asset(self):
        root = self.make_source(
            files={
                "bitcoin_BTC.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
                "ethereum_ETH.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
                "solana_SOL.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04"]),
                "dogecoin_DOGE.csv": [["Date", "Open"], ["2021-01-01", 1]],
            }
        )
        result = self.build(root)
        self.assertEqual(result.imported_assets, ["BTC", "ETH", "SOL"])
        self.assertEqual(result.skipped_assets[0].asset_symbol, "DOGE")

    def test_fails_on_product_gap_over_three_days(self):
        root = self.make_source(
            files={
                "bitcoin_BTC.csv": csv_rows(["2021-01-01", "2021-01-05"]),
                "ethereum_ETH.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04", "2021-01-05"]),
                "solana_SOL.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03", "2021-01-04", "2021-01-05"]),
            }
        )
        with self.assertRaisesRegex(ValueError, "BTC has a gap over 3 calendar days"):
            self.build(root, end_date=date(2021, 1, 5))


if __name__ == "__main__":
    unittest.main()
