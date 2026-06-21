CREATE TABLE IF NOT EXISTS installations (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL,
  version TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'chrome-web-store',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  payment_customer_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  valid_until TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_status ON entitlements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_installations_extension ON installations(extension_id);

CREATE TABLE IF NOT EXISTS license_checks (
  id TEXT PRIMARY KEY,
  installation_id TEXT NOT NULL,
  extension_id TEXT NOT NULL,
  version TEXT NOT NULL,
  result TEXT NOT NULL,
  reason TEXT,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_license_checks_installation ON license_checks(installation_id, checked_at);
