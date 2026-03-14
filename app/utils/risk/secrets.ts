const SECRET_PATH_PATTERNS = [
  /secret/i,
  /password/i,
  /token/i,
  /api_key/i,
  /private_key/i,
  /credentials/i
];

const BASE64_PATTERN = /^[A-Za-z0-9+/]{20,}={0,2}$/;
const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const AWS_ACCESS_KEY_PATTERN = /^AKIA[0-9A-Z]{16}$/;
const AWS_SECRET_KEY_PATTERN = /^[A-Za-z0-9/+=]{40}$/;
const GITHUB_TOKEN_PATTERN = /^gh[ps]_[A-Za-z0-9]{36,}$/;
const GITHUB_FINE_GRAINED_PATTERN = /^github_pat_[A-Za-z0-9_]{22,}$/;
const GENERIC_HEX_SECRET_PATTERN = /^[0-9a-f]{32,}$/i;

/**
 * Determines whether a key-value pair likely represents a secret.
 * Checks both the key name and the value shape.
 */
export function isLikelySecret(key: string, value: string): boolean {
  // Check if the key name suggests a secret
  for (const pattern of SECRET_PATH_PATTERNS) {
    if (pattern.test(key)) {
      return true;
    }
  }

  // Check if the value looks like a known secret format
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  if (JWT_PATTERN.test(value)) return true;
  if (AWS_ACCESS_KEY_PATTERN.test(value)) return true;
  if (AWS_SECRET_KEY_PATTERN.test(value) && value.length === 40) return true;
  if (GITHUB_TOKEN_PATTERN.test(value)) return true;
  if (GITHUB_FINE_GRAINED_PATTERN.test(value)) return true;
  if (GENERIC_HEX_SECRET_PATTERN.test(value) && value.length >= 32) return true;
  if (BASE64_PATTERN.test(value) && value.length > 20) return true;

  return false;
}

/**
 * Masks a secret value, showing the first 4 and last 4 characters
 * with **** in between. If the value is 12 characters or shorter,
 * the entire value is replaced with ****.
 */
export function maskValue(value: string): string {
  if (typeof value !== 'string' || value.length <= 12) {
    return '****';
  }

  const first = value.slice(0, 4);
  const last = value.slice(-4);
  return `${first}****${last}`;
}
