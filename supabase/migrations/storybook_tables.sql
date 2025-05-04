-- Create the storybooks table
CREATE TABLE IF NOT EXISTS storybooks (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  book_name TEXT NOT NULL DEFAULT 'My Magical Storybook',
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the storybook_entries table
CREATE TABLE IF NOT EXISTS storybook_entries (
  id SERIAL PRIMARY KEY,
  storybook_id INTEGER REFERENCES storybooks(id) ON DELETE CASCADE,
  creature_short_id TEXT REFERENCES creatures(short_id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_storybooks_device_id ON storybooks(device_id);
CREATE INDEX IF NOT EXISTS idx_storybook_entries_storybook_id ON storybook_entries(storybook_id);
CREATE INDEX IF NOT EXISTS idx_storybook_entries_creature_id ON storybook_entries(creature_short_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_storybooks_updated_at
BEFORE UPDATE ON storybooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
