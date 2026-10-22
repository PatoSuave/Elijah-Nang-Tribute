-- Timestamps use UTC YYYY-MM-DDTHH:MM:SS.ffffffZ. Never convert historical
-- PostgreSQL timestamps through JavaScript Date (which drops microseconds).
CREATE TABLE memorial_messages (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 60),
  location TEXT CHECK (location IS NULL OR length(location) <= 80),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || '000Z'),
  approved_at TEXT,
  moderation_notes TEXT,
  submission_fingerprint TEXT NOT NULL CHECK (length(submission_fingerprint) = 64 AND submission_fingerprint NOT GLOB '*[^a-f0-9]*'),
  CHECK (length(created_at) = 27 AND created_at GLOB '????-??-??T??:??:??.??????Z'),
  CHECK (approved_at IS NULL OR (length(approved_at) = 27 AND approved_at GLOB '????-??-??T??:??:??.??????Z'))
) STRICT;

CREATE INDEX memorial_messages_approved_page_idx ON memorial_messages (approved_at DESC, id DESC) WHERE status = 'approved';
CREATE INDEX memorial_messages_admin_page_idx ON memorial_messages (created_at DESC, id DESC) WHERE status = 'pending';
CREATE INDEX memorial_messages_duplicate_idx ON memorial_messages (submission_fingerprint, created_at DESC);

CREATE TABLE memorial_submission_rate_limits (
  fingerprint TEXT NOT NULL CHECK (length(fingerprint) = 64 AND fingerprint NOT GLOB '*[^a-f0-9]*'),
  window_start TEXT NOT NULL CHECK (length(window_start) = 27 AND window_start GLOB '????-??-??T??:00:00.000000Z'),
  submission_count INTEGER NOT NULL DEFAULT 0 CHECK (submission_count BETWEEN 0 AND 3),
  PRIMARY KEY (fingerprint, window_start)
) STRICT;
