const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;
const TOKEN_LENGTH = 24;

function generate(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}

export function generateId(): string {
  return generate(ID_LENGTH);
}

export function generateDeleteToken(): string {
  return generate(TOKEN_LENGTH);
}
