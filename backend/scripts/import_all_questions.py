"""
Script to import questions from all CSV files:
- questions_bigfive.csv
- questions_cognetive.csv
- questions_riasec.csv
- questions_sjt.csv
"""
import json
import os
import sys

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.question import Question


# List of CSV files to import
#: Category spellings that mean the same scale.
CATEGORY_ALIASES = {"self_org": "self_organization"}

CSV_FILES = [
    "questions_riasec.csv",
    "questions_bigfive.csv",
    "questions_cognetive.csv",
    "questions_sjt.csv",
]


def parse_options(options_str):
    """Parse options from CSV string to JSON."""
    if pd.isna(options_str) or not options_str:
        return None
    try:
        return json.loads(options_str)
    except Exception:
        return None


def parse_bool(value):
    """Parse boolean value from CSV."""
    if pd.isna(value):
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.upper() in ("TRUE", "1", "YES")
    return bool(value)


def import_questions():
    """Import questions from all CSV files."""
    data_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
    )

    # Create sync engine
    engine = create_engine(settings.SYNC_DATABASE_URL)

    # Schema is owned by Alembic; run `alembic upgrade head` before importing.
    SessionLocal = sessionmaker(bind=engine)

    total_imported = 0
    total_updated = 0

    with SessionLocal() as session:
        print("Connected to database.\n")

        for csv_file in CSV_FILES:
            file_path = os.path.join(data_dir, csv_file)

            if not os.path.exists(file_path):
                print(f"⚠️  File not found: {file_path}, skipping...")
                continue

            print(f"📂 Processing {csv_file}...")

            try:
                df = pd.read_csv(file_path)
            except Exception as e:
                print(f"   ❌ Error reading CSV: {e}")
                continue

            file_imported = 0
            file_updated = 0

            for index, row in df.iterrows():
                # Handle module mapping for SJT_SELF -> SJT
                module = row["module"]
                if module == "SJT_SELF":
                    module = "SJT"

                # The self-report half writes "self_org" where the situational
                # half writes "self_organization". Same construct, two
                # spellings — left as-is they score as two separate scales and
                # the report shows "Самоорганизация" twice.
                category = row["category"] if pd.notna(row.get("category")) else None
                if category in CATEGORY_ALIASES:
                    category = CATEGORY_ALIASES[category]

                question_data = {
                    "code": row["code"],
                    "module": module,
                    "category": category,
                    "text_ru": row["text_ru"] if pd.notna(row.get("text_ru")) else None,
                    "text_kz": row["text_kz"] if pd.notna(row.get("text_kz")) else None,
                    "text_en": row["text_en"] if pd.notna(row.get("text_en")) else None,
                    "type": row["type"],
                    "is_reverse": parse_bool(row.get("is_reverse")),
                    "options": parse_options(row.get("options")),
                }

                # Prepare the INSERT statement with UPSERT
                insert_stmt = insert(Question).values(question_data)

                upsert_stmt = insert_stmt.on_conflict_do_update(
                    index_elements=[Question.code],
                    set_={
                        "module": insert_stmt.excluded.module,
                        "category": insert_stmt.excluded.category,
                        "text_ru": insert_stmt.excluded.text_ru,
                        "text_kz": insert_stmt.excluded.text_kz,
                        "text_en": insert_stmt.excluded.text_en,
                        "type": insert_stmt.excluded.type,
                        "is_reverse": insert_stmt.excluded.is_reverse,
                        "options": insert_stmt.excluded.options,
                    },
                )

                try:
                    result = session.execute(upsert_stmt)
                    # Check if it was an insert or update
                    if result.rowcount > 0:
                        file_imported += 1
                except Exception as e:
                    print(f"   ❌ Error importing {row['code']}: {e}")
                    session.rollback()
                    continue

            session.commit()
            print(f"   ✅ Imported/Updated {file_imported} questions from {csv_file}")
            total_imported += file_imported

        # Get total count
        total_count = session.query(Question).count()
        print(f"\n{'='*50}")
        print(f"📊 Total questions in database: {total_count}")
        print(f"{'='*50}")

        # Show breakdown by module
        for module in ["RIASEC", "BIG5", "COGNITIVE", "SJT"]:
            count = session.query(Question).filter(Question.module == module).count()
            print(f"   {module}: {count} questions")


if __name__ == "__main__":
    print("=" * 50)
    print("📥 Importing questions from CSV files")
    print("=" * 50 + "\n")
    import_questions()
    print("\n✅ Import complete!")
