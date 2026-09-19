create table if not exists memorial_messages (
  id uuid primary key,
  display_name varchar(60) not null check (char_length(display_name) between 1 and 60),
  location varchar(80) check (location is null or char_length(location) <= 80),
  message varchar(1000) not null check (char_length(message) between 1 and 1000),
  status varchar(16) not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'archived')),
  created_at timestamptz not null default current_timestamp,
  approved_at timestamptz,
  moderation_notes text,
  submission_fingerprint char(64) not null check (submission_fingerprint ~ '^[a-f0-9]{64}$')
);

create index if not exists memorial_messages_approved_page_idx
  on memorial_messages (approved_at desc, id desc)
  where status = 'approved';

create index if not exists memorial_messages_admin_page_idx
  on memorial_messages (created_at desc, id desc);

create table if not exists memorial_submission_rate_limits (
  fingerprint char(64) not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  submission_count smallint not null default 0 check (submission_count between 0 and 3),
  primary key (fingerprint, window_start)
);

-- The application connects over Railway private networking. Do not grant
-- browser, anonymous, or general PUBLIC access to memorial data.
revoke all on memorial_messages from public;
revoke all on memorial_submission_rate_limits from public;
