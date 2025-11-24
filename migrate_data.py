import sqlite3
import psycopg2
import os
from dotenv import load_dotenv
import sys
from app import create_app

# Load environment variables
load_dotenv()

# Initialize DB (create tables)
app = create_app()

# Configuration
SQLITE_DB_PATH = os.path.join("instance", "registry.sqlite3")
POSTGRES_URL = os.environ.get("DATABASE_URL")

def get_sqlite_connection():
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"Error: SQLite database not found at {SQLITE_DB_PATH}")
        sys.exit(1)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_postgres_connection():
    if not POSTGRES_URL:
        print("Error: DATABASE_URL not found in .env")
        sys.exit(1)
    return psycopg2.connect(POSTGRES_URL)

def migrate_table(sqlite_conn, pg_conn, table_name, columns):
    print(f"Migrating table: {table_name}...")
    
    # Fetch data from SQLite
    sqlite_cursor = sqlite_conn.cursor()
    try:
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"Skipping {table_name}: {e}")
        return

    if not rows:
        print(f"  No data found in {table_name}.")
        return

    # Prepare Postgres insert
    pg_cursor = pg_conn.cursor()
    
    # Generate column list string and placeholders
    # We assume columns match exactly or we map them. 
    # Based on the app.py changes, the schema is largely the same.
    # However, we should be careful about column names.
    # Let's get column names dynamically from the first row or the cursor description.
    
    col_names = [description[0] for description in sqlite_cursor.description]
    cols_str = ", ".join(col_names)
    placeholders = ", ".join(["%s"] * len(col_names))
    
    query = f"INSERT INTO {table_name} ({cols_str}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
    
    count = 0
    for row in rows:
        values = [row[col] for col in col_names]
        try:
            pg_cursor.execute(query, values)
            count += 1
        except Exception as e:
            print(f"  Error inserting row ID {row['id']}: {e}")
            pg_conn.rollback()
            continue
            
    pg_conn.commit()
    print(f"  Migrated {count} rows.")

    # Reset sequence
    try:
        pg_cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), (SELECT MAX(id) FROM {table_name}));")
        pg_conn.commit()
        print(f"  Sequence reset for {table_name}.")
    except Exception as e:
        print(f"  Could not reset sequence for {table_name} (might be empty or no sequence): {e}")
        pg_conn.rollback()

def main():
    print("Starting migration...")
    
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()

    # Order matters due to Foreign Keys
    # 1. Persons (Independent)
    # 2. Agendas (Independent)
    # 3. Assistance Records (Depends on Persons)
    # 4. Household Images (Depends on Persons)
    # 5. Agenda Items (Depends on Agendas and Persons)

    tables = [
        "persons",
        "agendas",
        "assistance_records",
        "household_images",
        "agenda_items"
    ]

    for table in tables:
        migrate_table(sqlite_conn, pg_conn, table, [])

    sqlite_conn.close()
    pg_conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    main()
