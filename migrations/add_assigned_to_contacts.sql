-- Add assignedTo column to contacts table
ALTER TABLE contacts ADD COLUMN assigned_to INTEGER;
ALTER TABLE contacts ADD CONSTRAINT contacts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);

-- Create index for performance
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);