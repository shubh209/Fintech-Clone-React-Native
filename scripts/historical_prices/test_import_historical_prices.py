import csv
import json
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
            minimum_ready_rows=1,
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

    def test_build_import_reports_all_directory_assets_in_metadata(self):
        root = self.make_source(
            directory_rows=[[1, "bitcoin", "bitcoin_BTC.csv"], [2, "broken", "broken_BAD.csv"]],
            files={
                "bitcoin_BTC.csv": csv_rows(["2021-01-01", "2021-01-02", "2021-01-03"]),
                "broken_BAD.csv": [
                    HEADER,
                    ["2021-01-01 00:00:00+00:00", "", 12, 9, 11, 1000, "", 3, 10, 10],
                ],
            },
        )
        output_report = root / "report.json"
        output_sql = root / "out.sql"

        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=output_sql,
            output_report=output_report,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2021, 1, 3),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            category_map={"BTC": "Layer 1", "BAD": "Other"},
            required_product_symbols={"BTC"},
            minimum_ready_rows=1,
        )

        report = json.loads(output_report.read_text(encoding="utf-8"))
        assets = {asset["asset_id"]: asset for asset in report["simulation_assets"]}
        self.assertEqual(assets["bitcoin"]["status"], "ready")
        self.assertEqual(assets["bitcoin"]["category"], "Layer 1")
        self.assertEqual(assets["bitcoin"]["coin_gecko_id"], "bitcoin")
        self.assertEqual(assets["broken"]["status"], "historical_invalid")
        self.assertEqual(assets["broken"]["category"], "Other")
        self.assertEqual(assets["broken"]["unavailable_reason"], "Historical data needs validation.")
        self.assertIn("Open is required", assets["broken"]["unavailable_detail"])
        self.assertIsNone(assets["broken"]["coin_gecko_id"])
        self.assertEqual(result.imported_row_count, 3)

        sql = output_sql.read_text(encoding="utf-8")
        self.assertLess(sql.index("DELETE FROM simulation_assets;"), sql.index("DELETE FROM historical_crypto_prices;"))
        self.assertIn("INSERT INTO simulation_assets", sql)
        self.assertIn("'bitcoin', 'BTC'", sql)
        self.assertIn("'broken', 'BAD'", sql)

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

    def test_applies_manifest_repair_and_quarantine_before_validation(self):
        root = self.make_source(
            directory_rows=[
                [1, "bitcoin", "bitcoin_BTC.csv"],
                [2, "ethereum", "ethereum_ETH.csv"],
                [3, "solana", "solana_SOL.csv"],
                [4, "repairable", "repairable_RPR.csv"],
            ],
            files={
                "bitcoin_BTC.csv": csv_rows(["2020-12-31", "2021-01-01", "2021-01-02", "2021-01-03"]),
                "ethereum_ETH.csv": csv_rows(["2020-12-31", "2021-01-01", "2021-01-02", "2021-01-03"]),
                "solana_SOL.csv": csv_rows(["2020-12-31", "2021-01-01", "2021-01-02", "2021-01-03"]),
                "repairable_RPR.csv": [
                    HEADER,
                    ["2020-01-01 00:00:00+00:00", 10, 12, 0, 11, 1000, "", 3, 10, 10],
                    ["2020-01-02 00:00:00+00:00", 10, 12, 9, 11, 1000, "", 3, 10, 10],
                    ["2020-01-03 00:00:00+00:00", "", "", "", 0, 1000, "", 3, 10, 10],
                    ["2020-01-04 00:00:00+00:00", 10, 12, 9, 11, 1000, "", 3, 10, 10],
                ],
            },
        )
        manifest = root / "quality.json"
        manifest.write_text(
            json.dumps(
                {
                    "version": "test",
                    "repairs": [
                        {
                            "symbol": "RPR",
                            "date": "2020-01-01",
                            "method": "same_row_ohlc_range",
                            "reason": "Low was zero while Open/High/Close were positive.",
                            "set": {"Low": 10},
                        }
                    ],
                    "quarantines": [
                        {
                            "symbol": "RPR",
                            "date": "2020-01-03",
                            "reason": "Missing OHLC values cannot be repaired from same row.",
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )

        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2021, 1, 3),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            required_product_symbols={"BTC", "ETH", "SOL"},
            data_quality_manifest_path=manifest,
            minimum_ready_rows=1,
            maximum_quarantine_rate=0.5,
        )

        repairable = next(asset for asset in result.simulation_assets if asset.symbol == "RPR")
        self.assertEqual(repairable.status, "ready")
        self.assertEqual(repairable.imported_row_count, 3)
        self.assertEqual(repairable.repaired_row_count, 1)
        self.assertEqual(repairable.quarantined_row_count, 1)
        self.assertEqual(repairable.data_quality_status, "repaired_and_quarantined")

    def test_import_uses_earliest_available_csv_date(self):
        root = self.make_source(
            files={
                "bitcoin_BTC.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
                "ethereum_ETH.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
                "solana_SOL.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
                "dogecoin_DOGE.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
            }
        )
        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2021, 1, 2),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            minimum_ready_rows=1,
        )
        btc = next(item for item in result.coverage_report if item.asset_symbol == "BTC")
        self.assertEqual(btc.first_imported_date, "2020-12-30")

    def test_readiness_requires_minimum_valid_rows_and_quarantine_cap(self):
        dates = [f"2020-01-{day:02d}" for day in range(1, 11)]
        root = self.make_source(
            directory_rows=[
                [1, "bitcoin", "bitcoin_BTC.csv"],
                [2, "ethereum", "ethereum_ETH.csv"],
                [3, "solana", "solana_SOL.csv"],
                [4, "short", "short_SRT.csv"],
            ],
            files={
                "bitcoin_BTC.csv": csv_rows(dates),
                "ethereum_ETH.csv": csv_rows(dates),
                "solana_SOL.csv": csv_rows(dates),
                "short_SRT.csv": csv_rows(dates),
            },
        )
        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2020, 1, 10),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            required_product_symbols={"BTC", "ETH", "SOL"},
            minimum_ready_rows=365,
        )
        short = next(asset for asset in result.simulation_assets if asset.symbol == "SRT")
        self.assertEqual(short.status, "historical_invalid")
        self.assertEqual(short.unavailable_reason, "Historical data does not meet readiness threshold.")


if __name__ == "__main__":
    unittest.main()
