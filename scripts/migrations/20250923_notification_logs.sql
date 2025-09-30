-- Create notification logs table for tracking DROPS notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES drop_submissions(id) ON DELETE CASCADE,
    drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES drops_contractors(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'review', 'submission', 'reminder'
    status VARCHAR(50) NOT NULL, -- 'approved', 'needs-rectification', etc.
    channel VARCHAR(50) NOT NULL, -- 'whatsapp', 'browser', 'email'
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_drop_id ON notification_logs(drop_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_contractor_id ON notification_logs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification_logs
DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON notification_logs;
CREATE TRIGGER update_notification_logs_updated_at
    BEFORE UPDATE ON notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test notification log
INSERT INTO notification_logs (submission_id, drop_id, contractor_id, type, status, channel, sent, sent_at)
SELECT
    ds.id,
    d.id,
    d.contractor_id,
    'review',
    'approved',
    'browser',
    true,
    NOW()
FROM drop_submissions ds
JOIN drops d ON ds.drop_id = d.id
WHERE ds.status = 'approved'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMIT;