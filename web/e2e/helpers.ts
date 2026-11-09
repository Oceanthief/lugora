import { expect, type Locator, type Page } from "@playwright/test";

import { TEST_EMAIL_PREFIX } from "./db";

const MAILPIT = "http://127.0.0.1:54324";

/**
 * O Next mantém telas escondidas na memória, e um mesmo rótulo pode achar uma
 * cópia invisível. Este filtro fica só com o que está na tela.
 */
export const visible = (locator: Locator) => locator.locator("visible=true");

/** Um e-mail novo a cada teste: conta nova, sem esperar o limite de um código por minuto. */
export function newEmail(label: string): string {
  return `${TEST_EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

/** O @: de 3 a 30 caracteres, com minúsculas, números e _. */
function usernameFor(label: string): string {
  return `e2e_${label.replace(/[^a-z0-9]/g, "")}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 30);
}

/** A data de hoje mais `days` dias, como a tela mostra: 07/11/2026, no horário de Brasília. */
export function brDate(days = 0): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.now() + days * 86_400_000));
}

/** O código de login chega no Mailpit, o e-mail de mentira do Supabase local. Nunca é impresso. */
async function codeSentTo(email: string, after: number): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`);
    const summary = (await search.json()).messages?.[0];
    if (summary && new Date(summary.Created).getTime() > after) {
      const message = await (await fetch(`${MAILPIT}/api/v1/message/${summary.ID}`)).json();
      const code = String(message.Text).match(/\b\d{6}\b/)?.[0];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Nenhum código chegou para ${email}.`);
}

export async function signIn(page: Page, email: string, landing: "/perfil" | "/cadastro") {
  await page.goto("/entrar");
  // O campo chega em partes: espera o navegador dizer que ele está visível.
  await page.waitForFunction(
    () => [...document.querySelectorAll<HTMLInputElement>("input#email")].some((input) => input.checkVisibility()),
    null,
    { polling: 100 },
  );
  const sentAfter = Date.now() - 2000;
  await visible(page.locator("input#email")).fill(email);
  await visible(page.getByRole("button", { name: "Enviar código" })).click();
  const code = visible(page.getByLabel("Código de 6 dígitos"));
  await code.waitFor();
  await code.fill(await codeSentTo(email, sentAfter));
  await visible(page.getByRole("button", { name: "Entrar", exact: true })).click();
  await page.waitForURL(`**${landing}`, { timeout: 60_000 });
}

export async function completeSignup(page: Page, label: string, { allowLocation = false } = {}) {
  await expect(visible(page.getByRole("heading", { name: "Crie o seu perfil" }))).toBeVisible();
  await visible(page.getByLabel("Nome", { exact: true })).fill(`Pessoa ${label}`);
  await visible(page.getByLabel("Seu @")).fill(usernameFor(label));
  await visible(page.getByLabel("Cidade onde você mora")).fill("juiz");
  await visible(page.getByRole("button", { name: "Juiz de Fora, MG" })).click();
  await visible(page.getByLabel("Tenho 18 anos ou mais.")).check();
  await visible(page.locator("#policy-accepted")).check();
  if (allowLocation) await visible(page.getByLabel(/Localização precisa/)).check();
  await visible(page.getByRole("button", { name: "Concluir cadastro" })).click();
  await page.waitForURL("**/perfil", { timeout: 60_000 });
}

/** Cria uma conta de teste, mora em Juiz de Fora, e para no perfil. */
export async function newAccount(page: Page, label: string, options: { allowLocation?: boolean } = {}) {
  const email = newEmail(label);
  await signIn(page, email, "/cadastro");
  await completeSignup(page, label, options);
  return email;
}

/** Vai para uma aba pela barra inferior, como a pessoa faz. */
export async function goTo(page: Page, href: string) {
  await visible(page.locator(`nav a[href="${href}"]`)).first().click();
  await page.waitForURL(`**${href}`);
}

/** "Sair" recarrega a página inteira e mostra o convite para entrar. */
export async function signOut(page: Page) {
  await goTo(page, "/perfil");
  await visible(page.getByRole("button", { name: "Sair" })).click();
  await expect(visible(page.locator('a[href="/entrar"]')).first()).toBeVisible();
}

export const placeField = (page: Page) => visible(page.getByLabel("Lugar", { exact: true }));

export async function choosePlace(page: Page, query: string, name: string) {
  await placeField(page).fill(query);
  await visible(page.getByRole("button", { name: new RegExp(name) })).first().click();
}

/** As pílulas de nota, ocasião e visibilidade: o toque é no rótulo, com o texto exato. */
export async function chooseChip(page: Page, label: string) {
  const exact = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  await visible(page.locator("label", { hasText: exact })).first().click();
}

/** O número de um cartão do perfil (Países, Cidades, Lugares, Visitas). */
export function profileNumber(page: Page, label: string): Locator {
  return visible(page.locator("dt", { hasText: new RegExp(`^${label}$`) })).locator("xpath=following-sibling::dd[1]");
}
