/**
 * Regras do login por código (ADR 0009). Não falam com a rede, e por isso os
 * testes de login.test.ts conseguem cobrir cada caso.
 */

/** Precisam bater com supabase/config.toml; um teste confere. */
export const CODE_LENGTH = 6;
export const CODE_VALID_MINUTES = 10;

export type LoginError =
  | "invalidEmail"
  | "invalidCode"
  | "wrongCode"
  | "rateLimited"
  | "sendFailed"
  | "verifyFailed";

/** O que a tela mostra depois de cada envio do formulário. */
export type LoginState = {
  step: "email" | "code";
  email: string;
  error?: LoginError;
  resent?: boolean;
};

export const initialLoginState: LoginState = { step: "email", email: "" };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Quem copia o código do e-mail às vezes traz espaços junto. */
export function normalizeCode(value: string): string {
  return value.replace(/\s/g, "");
}

export function isValidCode(code: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
}

const RATE_LIMIT_CODES = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);

/** Traduz o erro do Supabase ao pedir o código. */
export function sendErrorFrom(code: string | undefined): LoginError {
  return code && RATE_LIMIT_CODES.has(code) ? "rateLimited" : "sendFailed";
}

/** Traduz o erro do Supabase ao conferir o código. Ele usa o mesmo erro para código errado e vencido. */
export function verifyErrorFrom(code: string | undefined): LoginError {
  if (code && RATE_LIMIT_CODES.has(code)) return "rateLimited";
  return code === "otp_expired" ? "wrongCode" : "verifyFailed";
}
