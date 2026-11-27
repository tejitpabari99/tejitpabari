ALTER TABLE events ADD COLUMN plugin TEXT;
-- All traffic before this migration came from sparehand (including tool_type=script pings from sparehand-auto Apps Scripts).
UPDATE events SET plugin = 'sparehand' WHERE plugin IS NULL;
CREATE INDEX events_plugin ON events(plugin);
