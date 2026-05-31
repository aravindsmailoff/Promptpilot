const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'contextpilot.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT source_app, COUNT(*) as count, MIN(created_at) as first_seen, MAX(created_at) as last_seen FROM memories GROUP BY source_app", (err, rows) => {
    if (err) {
      console.error('Error querying SQLite database:', err);
    } else {
      console.log('Memory counts in SQLite contextpilot.db:');
      console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
  });
});
