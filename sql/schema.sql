-- ============================================================
-- CIVITRACK — Analytics / Power BI schema additions
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- Safe to run more than once (IF NOT EXISTS guards throughout).
-- ============================================================

-- ------------------------------------------------------------
-- 1. entity_reports
--
-- Captures the per-entity, per-period data the DSAC challenge
-- statement asks for that CIVITRACK doesn't collect anywhere
-- yet: staff demographics, job creation, and audit findings.
-- Feeds the "Entity Reporting" section of /dsac/analytics and,
-- via the view below, Power BI.
-- ------------------------------------------------------------

create table if not exists entity_reports (
  id uuid primary key default gen_random_uuid(),

  organisation_id uuid not null references organisations(id) on delete cascade,
  funding_agreement_id uuid references funding_agreements(id) on delete set null,

  reporting_period_start date not null,
  reporting_period_end date not null,
  report_type text not null check (
    report_type in ('STRATEGIC_PLAN','ANNUAL_PERFORMANCE_PLAN','OPERATIONAL_PLAN',
                     'ANNUAL_REPORT','QUARTERLY_REPORT','FINANCIALS')
  ),

  -- Staff demographics
  staff_total integer default 0,
  staff_women integer default 0,
  staff_youth integer default 0,
  staff_disability integer default 0,

  -- Job creation
  jobs_created integer default 0,

  -- Audit / target tracking
  audit_finding text,                 -- e.g. 'Unqualified', 'Qualified', 'Adverse', 'Disclaimer'
  target_status text default 'NOT_STARTED' check (
    target_status in ('NOT_STARTED','IN_PROGRESS','DEADLINE_MISSED','COMPLETED')
  ),

  document_url text,                  -- link into the document repository (storage bucket path)

  submitted_by uuid references user_profiles(id),
  submitted_at timestamptz default now(),
  reviewed_by uuid references user_profiles(id),
  reviewed_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_entity_reports_org on entity_reports(organisation_id);
create index if not exists idx_entity_reports_period on entity_reports(reporting_period_start);

-- ------------------------------------------------------------
-- 2. KPI views
--
-- Thin, read-only views over existing + new tables. The app's
-- Analytics screen currently computes these client-side from
-- raw rows (fine at current volumes); Power BI should query
-- these views directly instead — one round trip, and the
-- aggregation logic lives in one place instead of being
-- duplicated between the app and every BI report.
-- ------------------------------------------------------------

create or replace view v_case_target_status as
select
  status,
  count(*) as case_count,
  count(*) filter (
    where due_date is not null
      and due_date < current_date
      and status <> 'APPROVED'
  ) as overdue_count
from accountability_cases
group by status;

create or replace view v_case_early_warning as
select
  ac.id,
  ac.case_number,
  ac.status,
  ac.priority,
  ac.due_date,
  (ac.due_date - current_date) as days_remaining,
  o.id as organisation_id,
  o.name as organisation_name
from accountability_cases ac
left join organisations o on o.id = ac.organisation_id
where ac.status <> 'APPROVED'
  and ac.due_date is not null
  and ac.due_date <= current_date + interval '30 days'
order by ac.due_date asc;

create or replace view v_funding_by_month as
select
  date_trunc('month', created_at)::date as month,
  currency,
  sum(allocated_amount) as total_allocated,
  count(*) as agreement_count
from funding_agreements
group by 1, 2
order by 1;

create or replace view v_organisations_by_year as
select
  extract(year from created_at)::int as year,
  organisation_type,
  count(*) as organisation_count
from organisations
group by 1, 2
order by 1;

create or replace view v_entity_staff_demographics as
select
  o.id as organisation_id,
  o.name as organisation_name,
  er.reporting_period_start,
  er.reporting_period_end,
  er.staff_total,
  er.staff_women,
  er.staff_youth,
  er.staff_disability,
  er.jobs_created,
  er.audit_finding,
  er.target_status
from entity_reports er
join organisations o on o.id = er.organisation_id;

-- ------------------------------------------------------------
-- 3. Row Level Security
--
-- Match whatever policy pattern the existing tables use. As a
-- starting point: DSAC admins/reviewers can read and write
-- everything; an organisation can only read/write its own
-- entity_reports rows via organisation_memberships.
-- Review and adjust before enabling in production — RLS wasn't
-- part of this pass, see README §5.
-- ------------------------------------------------------------

alter table entity_reports enable row level security;

create policy "DSAC staff can manage entity reports"
  on entity_reports
  for all
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role in ('DSAC_ADMIN', 'DSAC_REVIEWER')
    )
  );

create policy "Organisation members can manage their own entity reports"
  on entity_reports
  for all
  using (
    exists (
      select 1 from organisation_memberships om
      where om.user_id = auth.uid()
        and om.organisation_id = entity_reports.organisation_id
    )
  );

-- ============================================================
-- 4. Tables assumed by the Organisation / Workspace / Reviewer
--    screens brought in from the updated project
--
-- None of these were defined in either project's zip — the app
-- code assumes they already exist. Scaffolded here so a fresh
-- Supabase project can be brought up to the schema the frontend
-- expects. If your project already has these (with different
-- column names), reconcile against this instead of running it
-- blind.
-- ============================================================

-- Membership linking a user_profiles row to an organisation.
-- Referenced by app/organisation/dashboard.jsx, workspace.jsx,
-- and the create-organisation-admin edge function.
create table if not exists organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  membership_role text not null check (
    membership_role in ('ORG_ADMIN','ORG_STAFF','EXTERNAL_COLLABORATOR')
  ),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  joined_at timestamptz default now(),
  left_at timestamptz,
  created_at timestamptz default now(),
  unique (organisation_id, user_id)
);

create index if not exists idx_org_memberships_user on organisation_memberships(user_id);
create index if not exists idx_org_memberships_org on organisation_memberships(organisation_id);

-- Document metadata — the actual file bytes live in the "documents"
-- Supabase Storage bucket (see workspace.jsx / §5 below); this table
-- is the record of what was uploaded.
--
-- NOTE (inherited from the source code, not introduced here):
-- workspace.jsx's own comment says documents currently have no
-- organisation_id and are loaded by created_by only — i.e. a
-- document isn't yet scoped to an organisation, just to whoever
-- uploaded it. Worth fixing before this goes further, but that's a
-- frontend change to the protected-adjacent Workspace page, so it
-- wasn't changed in this merge.
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  current_version integer not null default 1,
  status text not null default 'active',
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_number integer not null,
  file_path text not null,        -- path within the "documents" storage bucket
  edited_by uuid references user_profiles(id),
  change_summary text,
  created_at timestamptz default now(),
  unique (document_id, version_number)
);

-- Reviewer workflow — a review assigned to a DSAC_REVIEWER against an
-- organisation, funding agreement, or accountability case.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references user_profiles(id),
  organisation_id uuid references organisations(id) on delete cascade,
  funding_agreement_id uuid references funding_agreements(id) on delete cascade,
  accountability_case_id uuid references accountability_cases(id) on delete cascade,
  review_type text not null check (
    review_type in ('ORGANISATION','FUNDING_AGREEMENT','ACCOUNTABILITY_CASE')
  ),
  status text not null default 'PENDING' check (
    status in ('PENDING','IN_PROGRESS','COMPLETED')
  ),
  decision text check (decision in ('APPROVED','REJECTED','NEEDS_CHANGES')),
  reviewer_comments text,
  verification_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_reviews_reviewer on reviews(reviewer_id);
create index if not exists idx_reviews_status on reviews(status);

-- Audit trail — written by workspace.jsx (fails silently if this table
-- doesn't exist yet, so it's safe to add later without a frontend change).
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  user_id uuid references user_profiles(id),
  organisation_id uuid references organisations(id),
  document_id uuid references documents(id),
  description text,
  created_at timestamptz default now()
);

alter table organisation_memberships enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table reviews enable row level security;
alter table audit_logs enable row level security;

create policy "DSAC staff can manage organisation memberships"
  on organisation_memberships for all
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role in ('DSAC_ADMIN','DSAC_REVIEWER')
    )
  );

create policy "Users can view their own memberships"
  on organisation_memberships for select
  using (user_id = auth.uid());

create policy "Users can manage their own documents"
  on documents for all
  using (created_by = auth.uid());

create policy "DSAC staff can view all documents"
  on documents for select
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role in ('DSAC_ADMIN','DSAC_REVIEWER')
    )
  );

create policy "Users can manage versions of their own documents"
  on document_versions for all
  using (
    exists (
      select 1 from documents d
      where d.id = document_versions.document_id and d.created_by = auth.uid()
    )
  );

create policy "Reviewers manage their own assigned reviews"
  on reviews for all
  using (reviewer_id = auth.uid());

create policy "DSAC admins manage all reviews"
  on reviews for all
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role = 'DSAC_ADMIN'
    )
  );

create policy "Users can insert their own audit log entries"
  on audit_logs for insert
  with check (user_id = auth.uid());

create policy "DSAC staff can view audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role in ('DSAC_ADMIN','DSAC_REVIEWER')
    )
  );

-- ============================================================
-- 5. Storage bucket
--
-- workspace.jsx uploads to a Supabase Storage bucket literally
-- named "documents" (STORAGE_BUCKET constant in that file). This
-- has to be created once, either in the Supabase dashboard
-- (Storage → New bucket → "documents", private) or via:
--
--   insert into storage.buckets (id, name, public)
--   values ('documents', 'documents', false)
--   on conflict (id) do nothing;
--
-- Then add storage.objects policies scoped to authenticated users
-- (the specifics depend on how you want to scope access — e.g. by
-- uploader, or by organisation once documents gain an
-- organisation_id — see the note on the documents table above).
-- ============================================================
