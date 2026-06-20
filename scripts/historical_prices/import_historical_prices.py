#!/usr/bin/env python3
"""Normalize historical crypto CSV data into D1 import SQL and a coverage report."""

from __future__ import annotations

import argparse
import csv
import json
import math
import sqlite3
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import pandas as pd


PRODUCT_SUPPORTED_SYMBOLS = {"BTC", "ETH", "SOL"}
REQUIRED_COLUMNS = [
    "Date",
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
    "Daily_Return",
    "High_Low_Spread",
    "SMA_7",
    "SMA_30",
]


@dataclass(frozen=True)
class DirectoryEntry:
    asset_name: str
    file_name: str
    symbol: str


@dataclass(frozen=True)
class SkippedAsset:
    asset_symbol: str
    file_name: str
    reason: str


@dataclass(frozen=True)
class DataQualityRepair:
    symbol: str
    date: str
    method: str
    reason: str
    set: dict[str, float]


@dataclass(frozen=True)
class DataQualityQuarantine:
    symbol: str
    reason: str
    date: str | None = None
    start_date: str | None = None
    end_date: str | None = None


@dataclass(frozen=True)
class DataQualityManifest:
    version: str
    repairs: list[DataQualityRepair]
    quarantines: list[DataQualityQuarantine]


@dataclass(frozen=True)
class CoverageReport:
    asset_symbol: str
    first_imported_date: str | None
    last_imported_date: str | None
    imported_row_count: int
    missing_date_count: int
    largest_gap_days: int
    next_available_resolution_can_be_needed: bool
    repaired_row_count: int
    quarantined_row_count: int
    eligible_row_count: int
    quarantine_rate: float
    data_quality_status: str


@dataclass(frozen=True)
class SimulationAssetMetadata:
    asset_id: str
    symbol: str
    name: str
    csv_file_name: str
    category: str
    status: str
    historical_symbol: str
    first_imported_date: str | None
    last_imported_date: str | None
    imported_row_count: int
    missing_date_count: int
    largest_gap_days: int
    repaired_row_count: int
    quarantined_row_count: int
    eligible_row_count: int
    quarantine_rate: float
    data_quality_status: str
    unavailable_reason: str | None
    unavailable_detail: str | None
    coin_gecko_id: str | None
    imported_at: str
    updated_at: str


@dataclass(frozen=True)
class ImportResult:
    imported_assets: list[str]
    skipped_assets: list[SkippedAsset]
    imported_row_count: int
    rejected_row_count: int
    coverage_report: list[CoverageReport]
    simulation_assets: list[SimulationAssetMetadata]


def _utc_yesterday(now: datetime) -> date:
    utc_today = now.astimezone(timezone.utc).date()
    return utc_today - timedelta(days=1)


def _extract_symbol(file_name: str) -> str:
    stem = Path(file_name).stem
    if "_" not in stem:
        return ""
    return stem.rsplit("_", 1)[1]


def _asset_id_from_file_name(file_name: str) -> str:
    stem = Path(file_name).stem
    if "_" not in stem:
        return stem
    return stem.rsplit("_", 1)[0]


def _normalize_date(value: object) -> date:
    timestamp = pd.to_datetime(value, utc=True, errors="raise")
    return timestamp.date()


def _nullable_float(value: object) -> float | None:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if isinstance(value, str) and value.strip() == "":
        return None
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ValueError("non-finite numeric value")
    return parsed


def _required_float(value: object, column: str) -> float:
    parsed = _nullable_float(value)
    if parsed is None:
        raise ValueError(f"{column} is required")
    return parsed


def _sql_quote(value: object) -> str:
    if value is None:
        return "NULL"
    if pd.isna(value):
        return "NULL"
    if isinstance(value, (int, float)):
        if not math.isfinite(float(value)):
            raise ValueError("Cannot write non-finite numeric SQL value")
        return repr(value)
    return "'" + str(value).replace("'", "''") + "'"


def read_directory_entries(source_root: Path) -> list[DirectoryEntry]:
    directory_path = source_root / "crypto_directory.csv"
    with directory_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    entries = []
    for row in rows:
        file_name = row.get("File Name", "").strip()
        asset_name = row.get("Crypto Name", "").strip()
        if not file_name or not asset_name:
            raise ValueError("crypto_directory.csv must include Crypto Name and File Name")
        entries.append(DirectoryEntry(asset_name=asset_name, file_name=file_name, symbol=_extract_symbol(file_name)))
    return entries


def read_category_map(path: Path) -> dict[str, str]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_data_quality_manifest(path: Path | None) -> DataQualityManifest:
    if path is None or not path.exists():
        return DataQualityManifest(version="none", repairs=[], quarantines=[])
    data = json.loads(path.read_text(encoding="utf-8"))
    return DataQualityManifest(
        version=data["version"],
        repairs=[DataQualityRepair(**item) for item in data.get("repairs", [])],
        quarantines=[DataQualityQuarantine(**item) for item in data.get("quarantines", [])],
    )


def assert_product_assets(entries: Iterable[DirectoryEntry], required_product_symbols: set[str]) -> None:
    symbols = {entry.symbol for entry in entries}
    missing = sorted(required_product_symbols - symbols)
    if missing:
        raise ValueError(f"Missing required product asset(s): {', '.join(missing)}")


def _data_quality_status(repaired_row_count: int, quarantined_row_count: int) -> str:
    if repaired_row_count > 0 and quarantined_row_count > 0:
        return "repaired_and_quarantined"
    if repaired_row_count > 0:
        return "repaired"
    if quarantined_row_count > 0:
        return "quarantined"
    return "clean"


def _manifest_key(symbol: str, row_date: date) -> tuple[str, str]:
    return symbol, row_date.isoformat()


def _quarantine_dates_for(symbol: str, quarantines: list[DataQualityQuarantine]) -> set[str]:
    dates: set[str] = set()
    for item in quarantines:
        if item.symbol != symbol:
            continue
        if item.date:
            dates.add(item.date)
            continue
        if not item.start_date or not item.end_date:
            raise ValueError(f"{symbol} quarantine must include date or start_date/end_date")
        current = date.fromisoformat(item.start_date)
        end = date.fromisoformat(item.end_date)
        if current > end:
            raise ValueError(f"{symbol} quarantine start_date must be before end_date")
        while current <= end:
            dates.add(current.isoformat())
            current += timedelta(days=1)
    return dates


def _coverage_for(
    symbol: str,
    dates: list[str],
    *,
    repaired_row_count: int,
    quarantined_row_count: int,
    eligible_row_count: int,
) -> CoverageReport:
    dates = sorted(dates)
    missing_date_count = 0
    largest_gap_days = 0
    for left, right in zip(dates, dates[1:]):
        gap_days = (date.fromisoformat(right) - date.fromisoformat(left)).days
        largest_gap_days = max(largest_gap_days, gap_days)
        if gap_days > 1:
            missing_date_count += gap_days - 1
    return CoverageReport(
        asset_symbol=symbol,
        first_imported_date=dates[0] if dates else None,
        last_imported_date=dates[-1] if dates else None,
        imported_row_count=len(dates),
        missing_date_count=missing_date_count,
        largest_gap_days=largest_gap_days,
        next_available_resolution_can_be_needed=missing_date_count > 0,
        repaired_row_count=repaired_row_count,
        quarantined_row_count=quarantined_row_count,
        eligible_row_count=eligible_row_count,
        quarantine_rate=(quarantined_row_count / eligible_row_count) if eligible_row_count else 0,
        data_quality_status=_data_quality_status(repaired_row_count, quarantined_row_count),
    )


def _assert_product_coverage(report: CoverageReport, start_date: date, end_date: date) -> None:
    if report.last_imported_date != end_date.isoformat():
        raise ValueError(f"{report.asset_symbol} coverage must end on {end_date.isoformat()}")
    if report.largest_gap_days > 3:
        raise ValueError(f"{report.asset_symbol} has a gap over 3 calendar days")


def _normalize_asset(
    source_root: Path,
    entry: DirectoryEntry,
    start_date: date,
    end_date: date,
    source_name: str,
    source_version: str,
    downloaded_at: str,
    imported_at: str,
    manifest: DataQualityManifest,
) -> tuple[pd.DataFrame, CoverageReport]:
    source_path = Path("crypto_top100") / entry.file_name
    df = pd.read_csv(source_root / source_path)

    missing_columns = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    if missing_columns:
        raise ValueError(f"{entry.symbol} is missing required column {missing_columns[0]}")

    normalized_dates = df["Date"].map(_normalize_date)
    df = df.assign(_normalized_date=normalized_dates)
    df = df[(df["_normalized_date"] >= start_date) & (df["_normalized_date"] <= end_date)].copy()
    eligible_row_count = int(len(df))

    repairs_by_key = {_manifest_key(item.symbol, date.fromisoformat(item.date)): item for item in manifest.repairs}
    repaired_dates: set[str] = set()
    for index, row in df.iterrows():
        row_date = row["_normalized_date"]
        repair = repairs_by_key.get(_manifest_key(entry.symbol, row_date))
        if repair is None:
            continue
        if repair.method != "same_row_ohlc_range":
            raise ValueError(f"{entry.symbol} {repair.date} uses unsupported repair method {repair.method}")
        for column, value in repair.set.items():
            if column not in REQUIRED_COLUMNS:
                raise ValueError(f"{entry.symbol} {repair.date} repair column {column} is not supported")
            df.at[index, column] = value
        repaired_dates.add(repair.date)

    row_dates = set(df["_normalized_date"].map(lambda value: value.isoformat()))
    quarantined_dates = _quarantine_dates_for(entry.symbol, manifest.quarantines) & row_dates
    if quarantined_dates:
        df = df[~df["_normalized_date"].map(lambda value: value.isoformat()).isin(quarantined_dates)].copy()

    df["date"] = df["_normalized_date"].map(lambda value: value.isoformat())

    if df["date"].duplicated().any():
        duplicate = df.loc[df["date"].duplicated(), "date"].iloc[0]
        raise ValueError(f"{entry.symbol} has duplicate row for {duplicate}")

    normalized = pd.DataFrame(index=df.index)
    normalized["asset_symbol"] = entry.symbol
    normalized["asset_name"] = entry.asset_name
    normalized["date"] = df["date"]
    normalized["open_usd"] = df["Open"].map(lambda value: _required_float(value, "Open"))
    normalized["high_usd"] = df["High"].map(lambda value: _required_float(value, "High"))
    normalized["low_usd"] = df["Low"].map(lambda value: _required_float(value, "Low"))
    normalized["close_usd"] = df["Close"].map(lambda value: _required_float(value, "Close"))
    normalized["volume_usd"] = df["Volume"].map(lambda value: _required_float(value, "Volume"))
    normalized["daily_return"] = df["Daily_Return"].map(_nullable_float)
    normalized["high_low_spread"] = df["High_Low_Spread"].map(_nullable_float)
    normalized["sma_7"] = df["SMA_7"].map(_nullable_float)
    normalized["sma_30"] = df["SMA_30"].map(_nullable_float)
    normalized["source_name"] = source_name
    normalized["source_path"] = str(source_path)
    normalized["source_version"] = source_version
    normalized["downloaded_at"] = downloaded_at
    normalized["imported_at"] = imported_at

    if (normalized[["open_usd", "high_usd", "low_usd", "close_usd"]] <= 0).any().any():
        raise ValueError(f"{entry.symbol} has non-positive OHLC values")
    if (normalized["high_usd"] < normalized["low_usd"]).any():
        raise ValueError(f"{entry.symbol} has High lower than Low")
    if ((normalized["close_usd"] < normalized["low_usd"]) | (normalized["close_usd"] > normalized["high_usd"])).any():
        raise ValueError(f"{entry.symbol} has Close outside Low/High range")
    if (normalized["volume_usd"] < 0).any():
        raise ValueError(f"{entry.symbol} has negative Volume")

    return normalized, _coverage_for(
        entry.symbol,
        normalized["date"].tolist(),
        repaired_row_count=len(repaired_dates),
        quarantined_row_count=len(quarantined_dates),
        eligible_row_count=eligible_row_count,
    )


def _build_simulation_asset_metadata(
    entries: list[DirectoryEntry],
    coverage: list[CoverageReport],
    skipped_assets: list[SkippedAsset],
    category_map: dict[str, str],
    imported_at: str,
    minimum_ready_rows: int,
    maximum_quarantine_rate: float,
) -> list[SimulationAssetMetadata]:
    coverage_by_symbol = {item.asset_symbol: item for item in coverage}
    skipped_by_symbol = {item.asset_symbol: item for item in skipped_assets}
    metadata: list[SimulationAssetMetadata] = []

    for entry in entries:
        asset_id = _asset_id_from_file_name(entry.file_name)
        asset_coverage = coverage_by_symbol.get(entry.symbol)
        skipped = skipped_by_symbol.get(entry.symbol)
        is_ready = (
            asset_coverage is not None
            and asset_coverage.imported_row_count >= minimum_ready_rows
            and asset_coverage.quarantine_rate <= maximum_quarantine_rate
        )
        status = "ready" if is_ready else "historical_invalid"
        if is_ready:
            unavailable_reason = None
            unavailable_detail = None
            coin_gecko_id = asset_id
        elif asset_coverage:
            unavailable_reason = "Historical data does not meet readiness threshold."
            unavailable_detail = (
                f"{entry.symbol} has {asset_coverage.imported_row_count} valid rows, "
                f"{asset_coverage.quarantined_row_count} quarantined rows, and "
                f"{asset_coverage.quarantine_rate:.2%} quarantined source rows."
            )
            coin_gecko_id = None
        else:
            unavailable_reason = "Historical data needs validation."
            unavailable_detail = skipped.reason if skipped else None
            coin_gecko_id = None
        metadata.append(
            SimulationAssetMetadata(
                asset_id=asset_id,
                symbol=entry.symbol,
                name=entry.asset_name,
                csv_file_name=entry.file_name,
                category=category_map.get(entry.symbol, "Other"),
                status=status,
                historical_symbol=entry.symbol,
                first_imported_date=asset_coverage.first_imported_date if asset_coverage else None,
                last_imported_date=asset_coverage.last_imported_date if asset_coverage else None,
                imported_row_count=asset_coverage.imported_row_count if asset_coverage else 0,
                missing_date_count=asset_coverage.missing_date_count if asset_coverage else 0,
                largest_gap_days=asset_coverage.largest_gap_days if asset_coverage else 0,
                repaired_row_count=asset_coverage.repaired_row_count if asset_coverage else 0,
                quarantined_row_count=asset_coverage.quarantined_row_count if asset_coverage else 0,
                eligible_row_count=asset_coverage.eligible_row_count if asset_coverage else 0,
                quarantine_rate=asset_coverage.quarantine_rate if asset_coverage else 0,
                data_quality_status=asset_coverage.data_quality_status if asset_coverage else "clean",
                unavailable_reason=unavailable_reason,
                unavailable_detail=unavailable_detail,
                coin_gecko_id=coin_gecko_id,
                imported_at=imported_at,
                updated_at=imported_at,
            )
        )

    return metadata


def _write_sql(rows: pd.DataFrame, report: dict, output_sql: Path) -> None:
    output_sql.parent.mkdir(parents=True, exist_ok=True)
    columns = [
        "asset_symbol",
        "asset_name",
        "date",
        "open_usd",
        "high_usd",
        "low_usd",
        "close_usd",
        "volume_usd",
        "daily_return",
        "high_low_spread",
        "sma_7",
        "sma_30",
        "source_name",
        "source_path",
        "source_version",
        "downloaded_at",
        "imported_at",
    ]
    with output_sql.open("w", encoding="utf-8") as handle:
        simulation_asset_columns = [
            "asset_id",
            "symbol",
            "name",
            "csv_file_name",
            "category",
            "status",
            "historical_symbol",
            "first_imported_date",
            "last_imported_date",
            "imported_row_count",
            "missing_date_count",
            "largest_gap_days",
            "repaired_row_count",
            "quarantined_row_count",
            "eligible_row_count",
            "quarantine_rate",
            "data_quality_status",
            "unavailable_reason",
            "unavailable_detail",
            "coin_gecko_id",
            "imported_at",
            "updated_at",
        ]
        handle.write("DELETE FROM simulation_assets;\n")
        for asset in report["simulation_assets"]:
            values = ", ".join(_sql_quote(asset[column]) for column in simulation_asset_columns)
            handle.write(
                f"INSERT INTO simulation_assets ({', '.join(simulation_asset_columns)}) VALUES ({values});\n"
            )
        handle.write("DELETE FROM historical_crypto_prices;\n")
        for row in rows[columns].itertuples(index=False, name=None):
            values = ", ".join(_sql_quote(value) for value in row)
            handle.write(f"INSERT INTO historical_crypto_prices ({', '.join(columns)}) VALUES ({values});\n")
        provenance = report["provenance"]
        provenance_columns = [
            "import_id",
            "source_name",
            "source_url",
            "source_version",
            "source_root_path",
            "downloaded_at",
            "imported_at",
            "imported_assets",
            "product_supported_assets",
            "imported_row_count",
            "rejected_row_count",
            "coverage_report_json",
        ]
        provenance_values = [
            provenance["import_id"],
            provenance["source_name"],
            provenance["source_url"],
            provenance["source_version"],
            provenance["source_root_path"],
            provenance["downloaded_at"],
            provenance["imported_at"],
            json.dumps(provenance["imported_assets"]),
            json.dumps(provenance["product_supported_assets"]),
            provenance["imported_row_count"],
            provenance["rejected_row_count"],
            json.dumps(provenance["coverage_report"]),
        ]
        handle.write("DELETE FROM historical_price_imports;\n")
        handle.write(
            f"INSERT INTO historical_price_imports ({', '.join(provenance_columns)}) VALUES "
            f"({', '.join(_sql_quote(value) for value in provenance_values)});\n"
        )


def build_import(
    source_root: Path,
    source_name: str,
    source_url: str,
    source_version: str,
    downloaded_at: str,
    output_sql: Path | None,
    output_report: Path | None,
    imported_at: str | None = None,
    end_date: date | None = None,
    now: datetime | None = None,
    category_map: dict[str, str] | None = None,
    required_product_symbols: set[str] | None = None,
    data_quality_manifest_path: Path | None = None,
    minimum_ready_rows: int = 365,
    maximum_quarantine_rate: float = 0.10,
) -> ImportResult:
    now = now or datetime.now(timezone.utc)
    imported_at = imported_at or now.isoformat()
    start_date = date.min
    end_date = end_date or _utc_yesterday(now)
    category_map = category_map or {}
    manifest = read_data_quality_manifest(data_quality_manifest_path)
    if required_product_symbols is None:
        required_product_symbols = PRODUCT_SUPPORTED_SYMBOLS
    entries = read_directory_entries(source_root)
    assert_product_assets(entries, required_product_symbols)

    frames: list[pd.DataFrame] = []
    skipped_assets: list[SkippedAsset] = []
    coverage: list[CoverageReport] = []

    for entry in entries:
        try:
            frame, asset_coverage = _normalize_asset(
                source_root=source_root,
                entry=entry,
                start_date=start_date,
                end_date=end_date,
                source_name=source_name,
                source_version=source_version,
                downloaded_at=downloaded_at,
                imported_at=imported_at,
                manifest=manifest,
            )
            if entry.symbol in required_product_symbols:
                _assert_product_coverage(asset_coverage, start_date, end_date)
            frames.append(frame)
            coverage.append(asset_coverage)
        except Exception as error:
            if entry.symbol in required_product_symbols:
                raise
            skipped_assets.append(SkippedAsset(entry.symbol, entry.file_name, str(error)))

    rows = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    imported_assets = sorted(rows["asset_symbol"].unique().tolist()) if not rows.empty else []
    simulation_assets = _build_simulation_asset_metadata(
        entries=entries,
        coverage=coverage,
        skipped_assets=skipped_assets,
        category_map=category_map,
        imported_at=imported_at,
        minimum_ready_rows=minimum_ready_rows,
        maximum_quarantine_rate=maximum_quarantine_rate,
    )
    report = {
        "imported_assets": imported_assets,
        "skipped_assets": [asdict(asset) for asset in skipped_assets],
        "imported_row_count": int(len(rows)),
        "rejected_row_count": len(skipped_assets),
        "coverage_report": [asdict(item) for item in coverage],
        "simulation_assets": [asdict(item) for item in simulation_assets],
        "provenance": {
            "import_id": f"{source_version}-{imported_at}",
            "source_name": source_name,
            "source_url": source_url,
            "source_version": source_version,
            "source_root_path": str(source_root),
            "downloaded_at": downloaded_at,
            "imported_at": imported_at,
            "imported_assets": imported_assets,
            "product_supported_assets": sorted(required_product_symbols),
            "imported_row_count": int(len(rows)),
            "rejected_row_count": len(skipped_assets),
            "coverage_report": [asdict(item) for item in coverage],
        },
    }

    if output_report:
        output_report.parent.mkdir(parents=True, exist_ok=True)
        output_report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if output_sql:
        _write_sql(rows, report, output_sql)

    return ImportResult(
        imported_assets=imported_assets,
        skipped_assets=skipped_assets,
        imported_row_count=int(len(rows)),
        rejected_row_count=len(skipped_assets),
        coverage_report=coverage,
        simulation_assets=simulation_assets,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", required=True, type=Path)
    parser.add_argument("--source-name", required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--source-version", required=True)
    parser.add_argument("--downloaded-at", required=True)
    parser.add_argument("--output-sql", type=Path)
    parser.add_argument("--output-report", type=Path)
    parser.add_argument("--end-date")
    parser.add_argument(
        "--data-quality-manifest",
        type=Path,
        default=Path(__file__).with_name("data_quality_manifest.json"),
    )
    args = parser.parse_args()

    result = build_import(
        source_root=args.source_root,
        source_name=args.source_name,
        source_url=args.source_url,
        source_version=args.source_version,
        downloaded_at=args.downloaded_at,
        output_sql=args.output_sql,
        output_report=args.output_report,
        end_date=date.fromisoformat(args.end_date) if args.end_date else None,
        category_map=read_category_map(Path(__file__).with_name("asset_categories.json")),
        data_quality_manifest_path=args.data_quality_manifest,
    )
    print(json.dumps(asdict(result), indent=2))


if __name__ == "__main__":
    main()
