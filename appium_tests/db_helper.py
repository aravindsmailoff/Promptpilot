import psycopg2
from psycopg2.extras import RealDictCursor
from config import DATABASE_URL

class DBHelper:
    """Helper class to query the Railway PostgreSQL database for test verification in Appium."""
    
    def __init__(self):
        self.db_url = DATABASE_URL
        self.conn = None

    def connect(self):
        """Establish connection to PostgreSQL."""
        if not self.db_url:
            raise ValueError("DATABASE_URL is not set in environment or config.")
        try:
            db_url = self.db_url
            if "sslmode=no-verify" in db_url:
                db_url = db_url.replace("sslmode=no-verify", "sslmode=require")
            self.conn = psycopg2.connect(db_url)
            return self.conn
        except Exception as e:
            print(f"[DBHelper] Connection failed: {e}")
            raise

    def close(self):
        """Close connection."""
        if self.conn:
            self.conn.close()
            self.conn = None

    def execute_query(self, query, params=None, fetch_one=True):
        """Execute a query and return dict results."""
        self.connect()
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                self.conn.commit()
                if fetch_one:
                    return cur.fetchone()
                return cur.fetchall()
        finally:
            self.close()

    def get_user_by_email(self, email: str):
        """Fetch user record by email."""
        query = 'SELECT * FROM "User" WHERE email = %s;'
        return self.execute_query(query, (email,))

    def get_latest_mission_by_user_id(self, user_id: str):
        """Fetch the most recent mission history for a user."""
        query = 'SELECT * FROM "MissionHistory" WHERE "userId" = %s ORDER BY "createdAt" DESC LIMIT 1;'
        return self.execute_query(query, (user_id,))

    def get_latest_submission_by_user_id(self, user_id: str):
        """Fetch the most recent custom model submission for a user."""
        query = 'SELECT * FROM "ModelSubmission" WHERE "userId" = %s ORDER BY "createdAt" DESC LIMIT 1;'
        return self.execute_query(query, (user_id,))
        
    def check_db_connection(self) -> bool:
        """Test connection status."""
        try:
            self.connect()
            self.close()
            return True
        except Exception:
            return False
