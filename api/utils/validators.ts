export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidSlug(value: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value);
}

export function generateSlug(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length);
}