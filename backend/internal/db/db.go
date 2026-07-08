package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS departures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  route_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT,
  platform TEXT,
  note TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
`

// Open opens the SQLite database at path, creating the parent directory,
// the schema, and initial sample data as needed.
func Open(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// modernc.org/sqlite does not support concurrent writers on one file;
	// a single connection avoids SQLITE_BUSY errors.
	conn.SetMaxOpenConns(1)

	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	if _, err := conn.Exec(schema); err != nil {
		conn.Close()
		return nil, fmt.Errorf("create schema: %w", err)
	}

	if err := seedIfEmpty(conn); err != nil {
		conn.Close()
		return nil, fmt.Errorf("seed database: %w", err)
	}

	return conn, nil
}

func seedIfEmpty(conn *sql.DB) error {
	var count int
	if err := conn.QueryRow(`SELECT COUNT(*) FROM departures`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	_, err := conn.Exec(`
		INSERT INTO departures (kind, route_name, origin, destination, departure_time, arrival_time, platform, note)
		VALUES
			('bus',   '高専前→大楽毛駅',   '高専前',   '大楽毛駅', '10:15', '10:35', '高専前', ''),
			('train', '大楽毛駅→釧路方面', '大楽毛駅', '釧路方面', '10:22', '10:41', '1番線',  '普通'),
			('train', '大楽毛駅→帯広方面', '大楽毛駅', '帯広方面', '10:41', '11:03', '2番線',  '普通')
	`)
	return err
}
