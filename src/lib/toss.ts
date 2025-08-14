export const TOSS_API_BASE = "https://api.tosspayments.com";

export function getTossSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY || process.env.TOSS_SECRET || "";
  return secretKey;
}

export function getBasicAuthHeader(secretKey: string): string {
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export function isTestEnv(): boolean {
  const key = getTossSecretKey();
  return key.startsWith("test_") || key.length === 0;
}


