import os
import sys

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import all models to ensure they are registered with Base
from app.core.config import settings
from app.db.base import Base
from app.models.question import Question


def seed_questions():
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
        "questions.csv",
    )

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Reading questions from {file_path}...")
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # Create sync engine
    engine = create_engine(settings.SYNC_DATABASE_URL)

    # Create tables if they don't exist
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        print("Connected to database.")

        # We iterate through the CSV to upsert questions.
        # UPSERT is used to allow updating question text without creating duplicates.
        for index, current_question_row in df.iterrows():
            question_data = {
                "code": current_question_row["code"],
                "module": current_question_row["module"],
                "category": current_question_row["category"]
                if pd.notna(current_question_row["category"])
                else None,
                "text_ru": current_question_row["text_ru"]
                if pd.notna(current_question_row["text_ru"])
                else None,
                "text_kz": current_question_row["text_kz"]
                if pd.notna(current_question_row["text_kz"])
                else None,
                "text_en": current_question_row["text_en"]
                if pd.notna(current_question_row["text_en"])
                else None,
                "type": current_question_row["type"],
                "is_reverse": bool(current_question_row["is_reverse"])
                if pd.notna(current_question_row["is_reverse"])
                else False,
            }

            # Prepare the INSERT statement
            insert_statement = insert(Question).values(question_data)

            # Update columns if conflict on 'code'
            # We explicitly list columns to update to ensure we don't accidentally overwrite ID or other future fields
            upsert_statement = insert_statement.on_conflict_do_update(
                index_elements=[Question.code],
                set_={
                    "module": insert_statement.excluded.module,
                    "category": insert_statement.excluded.category,
                    "text_ru": insert_statement.excluded.text_ru,
                    "text_kz": insert_statement.excluded.text_kz,
                    "text_en": insert_statement.excluded.text_en,
                    "type": insert_statement.excluded.type,
                    "is_reverse": insert_statement.excluded.is_reverse,
                },
            )

            try:
                session.execute(upsert_statement)
            except Exception as e:
                print(f"Error processing question {current_question_row['code']}: {e}")
                session.rollback()
                continue

        try:
            session.commit()
            print("Questions seeded successfully.")
        except Exception as e:
            print(f"Error committing session: {e}")
            session.rollback()


if __name__ == "__main__":
    seed_questions()
