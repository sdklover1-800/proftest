import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def check_and_create_db():
    # Connect to default postgres DB to create new DB
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="admin",
            host="localhost",
            port="5432",
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'proftest'")
        exists = cur.fetchone()

        if not exists:
            print("Database 'proftest' does not exist. Creating...")
            cur.execute("CREATE DATABASE proftest")
            print("Database 'proftest' created.")
        else:
            print("Database 'proftest' already exists.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error checking/creating database: {e}")
        exit(1)


if __name__ == "__main__":
    check_and_create_db()
