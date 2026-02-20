import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createAdminToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function getTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export function requireAdmin(headers: Headers): boolean {
  const token = getTokenFromHeaders(headers);
  if (!token) return false;
  return verifyAdminToken(token);
}
