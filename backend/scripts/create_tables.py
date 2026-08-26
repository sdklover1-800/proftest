"""
Deprecated: the schema is owned by Alembic.

`Base.metadata.create_all()` builds tables without recording a revision, so the
database ends up untracked and the next migration has nothing to apply against.
Use the migration tool instead:

    alembic upgrade head          # fresh database, or catch up an existing one
    alembic stamp <revision>      # database already at that revision's schema
"""

import sys

MESSAGE = __doc__.strip()

if __name__ == "__main__":
    print(MESSAGE)
    sys.exit(1)
