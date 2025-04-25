--DROP TABLE IF EXISTS matches;
CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_hash TEXT NOT NULL,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user (
    id INTEGER NOT NULL PRIMARY KEY,
    discord_id TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    discord_avatar TEXT
);


CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);