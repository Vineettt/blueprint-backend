CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
  ', table_name, table_name);

  EXECUTE format('
    CREATE TRIGGER trg_%I_updated_at
    BEFORE UPDATE ON %I
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_column();
  ', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  PERFORM add_updated_at_trigger('users');
END $$;

CREATE OR REPLACE FUNCTION remove_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
  ', table_name, table_name);
END;
$$ LANGUAGE plpgsql;