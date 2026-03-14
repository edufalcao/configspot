import type { ConfigFormat, ConfigTree } from '~/types/config';
import type { DiffResult } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';
import { parseConfig } from '~/utils/parsers';
import { compareConfigs } from '~/utils/diff';
import { classifyRisks } from '~/utils/risk';

export function useCompare() {
  const leftContent = ref('');
  const rightContent = ref('');
  const selectedFormat = ref<ConfigFormat | 'auto'>('auto');
  const maskSecrets = ref(true);

  const result = ref<DiffResult | null>(null);
  const risks = ref<RiskAnnotation[]>([]);
  const leftTree = ref<ConfigTree | null>(null);
  const rightTree = ref<ConfigTree | null>(null);
  const error = ref<string | null>(null);

  function compare() {
    error.value = null;
    result.value = null;
    risks.value = [];

    if (!leftContent.value.trim() && !rightContent.value.trim()) {
      error.value = 'Please provide at least one config to compare.';
      return;
    }

    const format = selectedFormat.value === 'auto' ? undefined : selectedFormat.value;

    const left = parseConfig(leftContent.value, format);
    const right = parseConfig(rightContent.value, format);

    leftTree.value = left;
    rightTree.value = right;

    if (left.errors.length > 0 || right.errors.length > 0) {
      const leftErrors = left.errors.map(e => `Original line ${e.line}: ${e.message}`);
      const rightErrors = right.errors.map(e => `Updated line ${e.line}: ${e.message}`);
      error.value = [...leftErrors, ...rightErrors].join('\n');
      return;
    }

    const diffResult = compareConfigs(left, right);
    result.value = diffResult;
    risks.value = classifyRisks(diffResult.changes);
  }

  function loadSample(format?: ConfigFormat) {
    const fmt = format || 'env';

    switch (fmt) {
      case 'env':
        leftContent.value = `# Production .env — current
DATABASE_URL=postgres://prod-db.example.com:5432/myapp
REDIS_URL=redis://cache.internal:6379
API_KEY=sk_live_abc123def456
SECRET_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
PORT=8080
DEBUG=false
FEATURE_NEW_DASHBOARD=false
LOG_LEVEL=warn
MAX_POOL_SIZE=10
CDN_URL=https://cdn.example.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PASSWORD=SG.xxxxxx`;

        rightContent.value = `# Production .env — proposed changes
DATABASE_URL=postgres://new-db.example.com:5432/myapp
REDIS_URL=redis://cache.internal:6379
API_KEY=sk_live_xyz789ghi012
SECRET_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
PORT=80
DEBUG=true
FEATURE_NEW_DASHBOARD=true
LOG_LEVEL=debug
MAX_POOL_SIZE=25
CDN_URL=https://cdn-v2.example.com
SMTP_HOST=smtp.sendgrid.net
SENTRY_DSN=https://abc@sentry.io/123`;
        break;

      case 'json':
        leftContent.value = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "sourceMap": true,
    "declaration": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;

        rightContent.value = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@utils/*": ["src/utils/*"]
    },
    "sourceMap": false,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*", "types/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}`;
        break;

      case 'yaml':
        leftContent.value = `version: "3.8"

services:
  api:
    image: myapp/api:1.4.2
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://db:5432/myapp
      REDIS_URL: redis://redis:6379
      API_SECRET: sk_live_abc123def456
      LOG_LEVEL: info
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: supersecret123
      POSTGRES_DB: myapp

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db_data:`;

        rightContent.value = `version: "3.8"

services:
  api:
    image: myapp/api:2.0.0
    ports:
      - "8080:8080"
      - "9090:9090"
    environment:
      DATABASE_URL: postgres://db:5432/myapp
      REDIS_URL: redis://redis:6379
      API_SECRET: sk_live_xyz789newkey
      LOG_LEVEL: debug
      SENTRY_DSN: https://abc@sentry.io/456
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: "1.0"
          memory: 1024M
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: rotated_pw_2026!
      POSTGRES_DB: myapp
      POSTGRES_MAX_CONNECTIONS: "200"

  redis:
    image: redis:7-alpine

  worker:
    image: myapp/worker:2.0.0
    environment:
      QUEUE_URL: redis://redis:6379
      CONCURRENCY: "10"
    depends_on:
      - redis

volumes:
  db_data:`;
        break;

      case 'toml':
        leftContent.value = `[package]
name = "configspot-cli"
version = "0.3.1"
edition = "2021"
authors = ["Dev Team <team@configspot.dev>"]
description = "CLI tool for config comparison"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
clap = { version = "4.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.0"

[profile.release]
opt-level = 2
lto = false
debug = true`;

        rightContent.value = `[package]
name = "configspot-cli"
version = "1.0.0"
edition = "2024"
authors = ["Dev Team <team@configspot.dev>"]
description = "CLI tool for config comparison and drift detection"
license = "MIT"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
clap = { version = "4.5", features = ["derive", "env"] }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
tracing = "0.1"
tracing-subscriber = "0.3"

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.0"
tempfile = "3.10"

[profile.release]
opt-level = 3
lto = true
debug = false
strip = true`;
        break;

      case 'ini':
        leftContent.value = `; MySQL database configuration — production
[mysqld]
port = 3306
bind-address = 127.0.0.1
max_connections = 100
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
slow_query_log = OFF
log_error = /var/log/mysql/error.log
key_buffer_size = 256M

[client]
port = 3306
socket = /var/run/mysqld/mysqld.sock
default-character-set = utf8mb4

[mysqldump]
quick
max_allowed_packet = 16M`;

        rightContent.value = `; MySQL database configuration — production (updated)
[mysqld]
port = 3306
bind-address = 0.0.0.0
max_connections = 500
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_error = /var/log/mysql/error.log
key_buffer_size = 512M
max_allowed_packet = 64M

[client]
port = 3306
socket = /var/run/mysqld/mysqld.sock
default-character-set = utf8mb4
ssl-mode = REQUIRED

[mysqldump]
quick
max_allowed_packet = 64M`;
        break;
    }

    selectedFormat.value = fmt;
    compare();
  }

  function clear() {
    leftContent.value = '';
    rightContent.value = '';
    result.value = null;
    risks.value = [];
    error.value = null;
    leftTree.value = null;
    rightTree.value = null;
  }

  return {
    leftContent,
    rightContent,
    selectedFormat,
    maskSecrets,
    result,
    risks,
    leftTree,
    rightTree,
    error,
    compare,
    loadSample,
    clear
  };
}
