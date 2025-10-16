import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt) as (password: string | Buffer, salt: string | Buffer, keylen: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `s:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [prefix, salt, hex] = hash.split(":");
    if (prefix !== "s" || !salt || !hex) return false;
    const derived = await scrypt(password, salt, 64);
    const given = Buffer.from(hex, "hex");
    return given.length === derived.length && timingSafeEqual(given, derived);
  } catch {
    return false;
  }
}

