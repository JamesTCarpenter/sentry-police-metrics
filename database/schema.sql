
CREATE TABLE IF NOT EXISTS stop_searches (
  id TEXT PRIMARY KEY,

  source_month TEXT NOT NULL,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('located', 'unlocated')),

  datetime TEXT,
  age_range TEXT,
  gender TEXT,

  self_defined_ethnicity TEXT,
  officer_defined_ethnicity TEXT,

  outcome TEXT,
  outcome_id TEXT,
  object_of_search TEXT,
  legislation TEXT,
  search_type TEXT,

  involved_person INTEGER,
  operation INTEGER,
  operation_name TEXT,

  outcome_linked_to_object_of_search INTEGER,
  removal_of_more_than_outer_clothing INTEGER,

  latitude REAL,
  longitude REAL,
  street_id INTEGER,
  street_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_stop_datetime
ON stop_searches(datetime);

CREATE INDEX IF NOT EXISTS idx_stop_source_month
ON stop_searches(source_month);

CREATE INDEX IF NOT EXISTS idx_stop_age
ON stop_searches(age_range);

CREATE INDEX IF NOT EXISTS idx_stop_gender
ON stop_searches(gender);

CREATE INDEX IF NOT EXISTS idx_stop_ethnicity_self
ON stop_searches(self_defined_ethnicity);

CREATE INDEX IF NOT EXISTS idx_stop_ethnicity_officer
ON stop_searches(officer_defined_ethnicity);

CREATE INDEX IF NOT EXISTS idx_stop_outcome
ON stop_searches(outcome);

CREATE INDEX IF NOT EXISTS idx_stop_object
ON stop_searches(object_of_search);

CREATE INDEX IF NOT EXISTS idx_stop_location
ON stop_searches(latitude, longitude);
