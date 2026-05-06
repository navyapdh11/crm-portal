import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY || "a-very-secret-key-that-must-be-32-bytes"; // Default for demo only, MUST be set in prod
const IV_LENGTH = 12;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
  
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, "base64");
  
  const iv = buffer.slice(0, IV_LENGTH);
  const tag = buffer.slice(IV_LENGTH, IV_LENGTH + 16);
  const text = buffer.slice(IV_LENGTH + 16);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(text), decipher.final()]).toString("utf8");
}
