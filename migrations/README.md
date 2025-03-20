# Database Migrations

This directory contains SQL migrations for the Supabase database.

## Running the Finding Status Migration

To add the capability for tracking finding statuses, you need to run the `finding_statuses.sql` migration.

### Using the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Click "New Query"
4. Copy and paste the contents of `finding_statuses.sql` into the query editor
5. Click "Run" to execute the migration

### Using the CLI:

If you have the Supabase CLI installed, you can run:

```bash
supabase db run -f migrations/finding_statuses.sql
```

## What This Migration Does

The `finding_statuses.sql` migration:

1. Creates a `finding_statuses` table to track the status of audit findings
2. Adds appropriate relationships to the `audits` table
3. Creates an index for faster lookups
4. Sets up a trigger to automatically update the `updated_at` timestamp

## Schema

The `finding_statuses` table has the following schema:

- `id` - UUID primary key
- `audit_id` - Foreign key reference to the audit
- `finding_id` - String ID of the finding within the audit
- `status` - Current status: 'open', 'in_progress', 'resolved', or 'ignored'
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated 