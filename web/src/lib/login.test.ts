import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CODE_LENGTH,
  CODE_VALID_MINUTES,
  isValidCode,
  isValidEmail,
  normalizeCode,
  normalizeEmail,
  sendErrorFrom,
  verifyErrorFrom,
} from "./login";

describe("e-mail", () => {
  it("ignora espaços nas pontas e maiúsculas", () => {
    expect(normalizeEmail("  Duda@Example.COM ")).toBe("duda@example.com");
  });

  it("aceita um endereço comum", () => {
    expect(isValidEmail("duda@example.com")).toBe(true);
  });

  it.each(["", "duda", "duda@", "@example.com", "duda@example", "du da@example.com"])(
    "recusa %j",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );

  it("recusa um endereço longo demais", () => {
    expect(isValidEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });
});

describe("código", () => {
  it("tira os espaços de quem copiou do e-mail", () => {
    expect(normalizeCode(" 123 456 ")).toBe("123456");
  });

  it("aceita 6 dígitos", () => {
    expect(isValidCode("012345")).toBe(true);
  });

  it.each(["", "12345", "1234567", "12345a", "abcdef"])("recusa %j", (code) => {
    expect(isValidCode(code)).toBe(false);
  });
});

describe("erros do Supabase", () => {
  it("mostra o aviso de espera quando passa do limite", () => {
    expect(sendErrorFrom("over_email_send_rate_limit")).toBe("rateLimited");
    expect(verifyErrorFrom("over_request_rate_limit")).toBe("rateLimited");
  });

  it("trata código errado e vencido do mesmo jeito", () => {
    expect(verifyErrorFrom("otp_expired")).toBe("wrongCode");
  });

  it("cai numa mensagem genérica no resto", () => {
    expect(sendErrorFrom("unexpected_failure")).toBe("sendFailed");
    expect(sendErrorFrom(undefined)).toBe("sendFailed");
    expect(verifyErrorFrom(undefined)).toBe("verifyFailed");
  });
});

describe("configuração do banco local", () => {
  const repo = new URL("../../../", import.meta.url);
  const config = readFileSync(new URL("supabase/config.toml", repo), "utf8");
  const template = readFileSync(new URL("supabase/templates/codigo-de-acesso.html", repo), "utf8");

  /** Lê um campo da seção [auth.email]: outras seções usam o mesmo nome. */
  function emailSetting(name: string): number {
    const section = config.split("[auth.email]")[1].split("\n[")[0];
    return Number(new RegExp(`^${name} = (\\d+)`, "m").exec(section)?.[1]);
  }

  it("usa o mesmo tamanho de código que a tela", () => {
    expect(emailSetting("otp_length")).toBe(CODE_LENGTH);
  });

  it("usa a mesma validade que a tela", () => {
    expect(emailSetting("otp_expiry")).toBe(CODE_VALID_MINUTES * 60);
  });

  it("exige provar que o e-mail é seu antes de dar a sessão", () => {
    // Desligado, alguém cria a conta com o e-mail de outra pessoa e continua dentro dela.
    const section = config.split("[auth.email]")[1].split("\n[")[0];
    expect(section).toMatch(/^enable_confirmations = true$/m);
  });

  it("manda o código no e-mail, sem link de login", () => {
    expect(template).toContain("{{ .Token }}");
    expect(template).toContain(`${CODE_VALID_MINUTES} minutos`);
    expect(template).not.toContain("ConfirmationURL");
  });

  it("manda só código também nos fluxos que o app não oferece, mas a API sim", () => {
    const emailChange = readFileSync(new URL("supabase/templates/troca-de-email.html", repo), "utf8");
    expect(emailChange).toContain("{{ .Token }}");
    expect(emailChange).not.toContain("ConfirmationURL");

    for (const flow of ["magic_link", "confirmation", "recovery", "email_change"]) {
      expect(config).toContain(`[auth.email.template.${flow}]`);
    }
  });
});
