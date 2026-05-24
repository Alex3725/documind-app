-- Add uploader audit fields to files table
ALTER TABLE files ADD COLUMN uploader_ip VARCHAR(255) COMMENT 'IP address of the uploader for audit purposes';
ALTER TABLE files ADD COLUMN uploader_token VARCHAR(500) COMMENT 'Authentication token of the uploader (first 50 chars) for audit purposes';

-- Add indexes for audit queries
CREATE INDEX idx_files_owner_uploader_ip ON files(owner, uploader_ip);
CREATE INDEX idx_files_upload_date ON files(upload_date);
