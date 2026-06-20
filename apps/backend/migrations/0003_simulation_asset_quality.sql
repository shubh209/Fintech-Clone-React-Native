ALTER TABLE simulation_assets ADD COLUMN repaired_row_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN quarantined_row_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN eligible_row_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN quarantine_rate REAL NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN data_quality_status TEXT NOT NULL DEFAULT 'clean';
