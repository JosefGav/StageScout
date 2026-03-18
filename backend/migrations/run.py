import os
import sys
import psycopg2
from dotenv import load_dotenv

MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(MIGRATIONS_DIR, "..", ".env"))


def run_migrations(skip_vector_index=True):
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()

    files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))

    for filename in files:
        if skip_vector_index and filename == "003_vector_index.sql":
            print(f"Skipping {filename} (run after seeding data)")
            continue

        filepath = os.path.join(MIGRATIONS_DIR, filename)
        print(f"Running {filename}...")
        with open(filepath, "r") as f:
            sql = f.read()
        try:
            cur.execute(sql)
            print(f"  OK")
        except psycopg2.errors.DuplicateTable as e:
            print(f"  Already exists, skipping: {e.pgerror.strip().splitlines()[0]}")
        except Exception as e:
            print(f"  ERROR: {e}")
            raise

    cur.close()
    conn.close()
    print("Migrations complete.")


if __name__ == "__main__":
    skip_vector = "--include-vector-index" not in sys.argv
    run_migrations(skip_vector_index=skip_vector)
