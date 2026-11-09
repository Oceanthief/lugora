import { defineConfig } from "@playwright/test";

/**
 * Testes de fluxo (Playwright): o app de verdade, num navegador, contra o
 * Supabase local. Precisam do banco no ar (`npx supabase start`, na raiz) e
 * do build (`npm run build`). Os códigos de login vêm do Mailpit local.
 */
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  // Um teste por vez: a máquina tem pouca memória, e cada teste cria contas.
  workers: 1,
  fullyParallel: false,
  forbidOnly: ci,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    // Mobile-first: o mesmo tamanho dos prints em 390 × 844.
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    // Na máquina do Victor, usa o Chrome já instalado, para poupar disco.
    // Na CI, o Chromium que o Playwright baixa.
    ...(ci ? {} : { channel: "chrome" }),
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    // Se o app já estiver no ar (npm run start em outra janela), usa esse.
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
