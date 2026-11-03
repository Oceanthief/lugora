"use server";

import { redirect } from "next/navigation";

import {
  isValidCode,
  isValidEmail,
  normalizeCode,
  normalizeEmail,
  sendErrorFrom,
  verifyErrorFrom,
  type LoginState,
} from "@/lib/login";
import { hasProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

/** Recebe os três botões da tela de entrada: enviar, reenviar e conferir o código. */
export async function submitLogin(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (intent === "change-email") return { step: "email", email };
  if (intent === "verify") return verifyCode(email, String(formData.get("code") ?? ""));
  return requestCode(email, intent === "resend");
}

async function requestCode(email: string, isResend: boolean): Promise<LoginState> {
  if (!isValidEmail(email)) return { step: "email", email, error: "invalidEmail" };

  const supabase = await createClient();
  // Conta nova ou antiga recebem a mesma resposta: a tela não revela quem já tem conta.
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { step: isResend ? "code" : "email", email, error: sendErrorFrom(error.code) };

  return { step: "code", email, resent: isResend };
}

async function verifyCode(email: string, rawCode: string): Promise<LoginState> {
  if (!isValidEmail(email)) return { step: "email", email, error: "invalidEmail" };

  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) return { step: "code", email, error: "invalidCode" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) return { step: "code", email, error: verifyErrorFrom(error?.code) };

  // Quem ainda não tem perfil termina o cadastro antes de seguir.
  redirect((await hasProfile(data.user.id)) ? "/perfil" : "/cadastro");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/perfil");
}
