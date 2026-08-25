import sqlite3
from pathlib import Path

db = Path(__file__).with_name("mario_chess.db")
if not db.exists():
    print("La base n'existe pas encore. Lance d'abord server.py.")
    raise SystemExit

conn = sqlite3.connect(db)
rows = conn.execute(
    "SELECT name, elo, updated_at FROM players ORDER BY elo DESC, name ASC"
).fetchall()

print("")
print("CLASSEMENT MARIO CHESS")
print("=" * 58)

if not rows:
    print("Aucun joueur enregistré.")
else:
    for i, (name, elo, updated) in enumerate(rows, 1):
        print(f"{i:>3}. {name:<20} {elo:>4} ELO   {updated}")

print("")
