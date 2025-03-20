-- Create finding_statuses table to track status of findings
CREATE TABLE IF NOT EXISTS finding_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    finding_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (audit_id, finding_id)
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS finding_statuses_audit_id_idx ON finding_statuses(audit_id);

-- Create a trigger to automatically update the updated_at field
CREATE OR REPLACE FUNCTION update_finding_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_finding_status_updated_at
BEFORE UPDATE ON finding_statuses
FOR EACH ROW
EXECUTE FUNCTION update_finding_status_updated_at(); 