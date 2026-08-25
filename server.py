import http.server
import json
import os
import sqlite3
import threading
import webbrowser
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

HOST = "127.0.0.1"
PORT = 8000
ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(ROOT, "mario_chess.db")

os.chdir(ROOT)

def db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL COLLATE NOCASE UNIQUE,
                elo INTEGER NOT NULL DEFAULT 1200,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_players_elo
            ON players(elo DESC)
        """)
        conn.commit()

def clean_name(value):
    value = str(value or "")
    value = "".join(ch for ch in value if ch.isprintable())
    value = " ".join(value.split()).strip()
    return value[:20]

def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def row_to_player(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "elo": row["elo"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }

class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "MarioChessDB/1.0"

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, status, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > 100_000:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/health":
            return self.send_json(200, {"ok": True, "database": "sqlite"})

        if parsed.path == "/api/leaderboard":
            with db_connection() as conn:
                rows = conn.execute("""
                    SELECT id, name, elo, created_at, updated_at
                    FROM players
                    ORDER BY elo DESC, updated_at ASC
                    LIMIT 100
                """).fetchall()
            return self.send_json(200, {
                "players": [row_to_player(r) for r in rows]
            })

        if parsed.path == "/api/player":
            query = parse_qs(parsed.query)
            name = clean_name((query.get("name") or [""])[0])
            if not name:
                return self.send_json(400, {"error": "Nom manquant."})

            with db_connection() as conn:
                row = conn.execute("""
                    SELECT id, name, elo, created_at, updated_at
                    FROM players
                    WHERE name = ? COLLATE NOCASE
                """, (name,)).fetchone()

            if row is None:
                return self.send_json(404, {"error": "Joueur introuvable."})
            return self.send_json(200, row_to_player(row))

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        data = self.read_json()

        if parsed.path == "/api/profile":
            name = clean_name(data.get("name"))
            if len(name) < 2:
                return self.send_json(400, {
                    "error": "Le nom doit contenir au moins 2 caractères."
                })

            try:
                initial_elo = int(data.get("initial_elo", 1200))
            except Exception:
                initial_elo = 1200
            initial_elo = max(100, min(4000, initial_elo))
            now = utc_now()

            with db_connection() as conn:
                row = conn.execute("""
                    SELECT id, name, elo, created_at, updated_at
                    FROM players
                    WHERE name = ? COLLATE NOCASE
                """, (name,)).fetchone()

                created = False
                if row is None:
                    conn.execute("""
                        INSERT INTO players(name, elo, created_at, updated_at)
                        VALUES (?, ?, ?, ?)
                    """, (name, initial_elo, now, now))
                    conn.commit()
                    created = True
                    row = conn.execute("""
                        SELECT id, name, elo, created_at, updated_at
                        FROM players
                        WHERE name = ? COLLATE NOCASE
                    """, (name,)).fetchone()

            payload = row_to_player(row)
            payload["created"] = created
            return self.send_json(200, payload)

        if parsed.path == "/api/elo":
            name = clean_name(data.get("name"))
            if len(name) < 2:
                return self.send_json(400, {"error": "Nom invalide."})

            try:
                elo = int(data.get("elo"))
            except Exception:
                return self.send_json(400, {"error": "ELO invalide."})

            elo = max(100, min(4000, elo))
            now = utc_now()

            with db_connection() as conn:
                cur = conn.execute("""
                    UPDATE players
                    SET elo = ?, updated_at = ?
                    WHERE name = ? COLLATE NOCASE
                """, (elo, now, name))

                if cur.rowcount == 0:
                    return self.send_json(404, {"error": "Joueur introuvable."})

                conn.commit()
                row = conn.execute("""
                    SELECT id, name, elo, created_at, updated_at
                    FROM players
                    WHERE name = ? COLLATE NOCASE
                """, (name,)).fetchone()

            return self.send_json(200, row_to_player(row))

        return self.send_json(404, {"error": "API inconnue."})

class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == "__main__":
    init_db()
    url = f"http://localhost:{PORT}"

    print("")
    print("========================================")
    print("  MARIO CHESS + BDD SQLITE")
    print("========================================")
    print(f"Jeu : {url}")
    print(f"BDD : {DB_PATH}")
    print("Ctrl+C pour arrêter.")
    print("")

    threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    with Server((HOST, PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServeur arrêté.")
