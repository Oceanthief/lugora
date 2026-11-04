import { describe, expect, it } from "vitest";

import {
  isValidUsername,
  keepOptionalPurposes,
  NAME_MAX_LENGTH,
  normalizeUsername,
  signupFailureFrom,
  validateSignup,
  type SignupDraft,
} from "./signup";

const CITY_ID = "20000000-0000-4000-8000-000000000001";

const valid: SignupDraft = {
  name: "Duda Freitas",
  username: "dudafreitas",
  cityId: CITY_ID,
  ageConfirmed: true,
  policyAccepted: true,
  grantedPurposes: [],
};

describe("@", () => {
  it("tira o @ e passa para minúsculas", () => {
    expect(normalizeUsername("  @DudaFreitas ")).toBe("dudafreitas");
  });

  it.each(["abc", "duda_freitas", "duda2", "a".repeat(30)])("aceita %j", (username) => {
    expect(isValidUsername(username)).toBe(true);
  });

  it.each(["", "ab", "a".repeat(31), "com espaco", "maiuscula_A", "acentuação", "ponto.final"])("recusa %j", (username) => {
    expect(isValidUsername(username)).toBe(false);
  });
});

describe("validação do cadastro", () => {
  it("aceita um cadastro completo", () => {
    expect(validateSignup(valid)).toEqual({});
  });

  // Critério de aceite da Fatia 2.
  it("não conclui sem a confirmação de 18+", () => {
    expect(validateSignup({ ...valid, ageConfirmed: false })).toEqual({ ageConfirmed: "ageRequired" });
  });

  it("não conclui sem aceitar a política", () => {
    expect(validateSignup({ ...valid, policyAccepted: false })).toEqual({ policyAccepted: "policyRequired" });
  });

  it("não exige os consentimentos opcionais", () => {
    expect(validateSignup({ ...valid, grantedPurposes: [] })).toEqual({});
  });

  it("não aceita um nome só de espaços", () => {
    expect(validateSignup({ ...valid, name: "   " })).toEqual({ name: "nameRequired" });
  });

  it("não aceita um nome longo demais", () => {
    expect(validateSignup({ ...valid, name: "a".repeat(NAME_MAX_LENGTH + 1) })).toEqual({ name: "nameTooLong" });
  });

  it.each(["", "juiz de fora", "123"])("não aceita a cidade %j", (cityId) => {
    expect(validateSignup({ ...valid, cityId })).toEqual({ city: "cityRequired" });
  });

  it("mostra todos os erros de uma vez", () => {
    expect(
      validateSignup({
        name: "",
        username: "",
        cityId: "",
        ageConfirmed: false,
        policyAccepted: false,
        grantedPurposes: [],
      }),
    ).toEqual({
      name: "nameRequired",
      username: "usernameInvalid",
      city: "cityRequired",
      ageConfirmed: "ageRequired",
      policyAccepted: "policyRequired",
    });
  });
});

describe("finalidades opcionais", () => {
  it("guarda só as que existem", () => {
    expect(keepOptionalPurposes(["analytics", "essential", "inventada"])).toEqual(["analytics"]);
  });
});

describe("erros do banco", () => {
  it("reconhece a recusa do 18+ e do aceite", () => {
    expect(signupFailureFrom({ message: "age_confirmation_required" })).toEqual({
      kind: "field",
      errors: { ageConfirmed: "ageRequired" },
    });
    expect(signupFailureFrom({ message: "policy_acceptance_required" })).toEqual({
      kind: "field",
      errors: { policyAccepted: "policyRequired" },
    });
  });

  it("diz quando o @ já tem dono", () => {
    expect(
      signupFailureFrom({
        code: "23505",
        message: 'duplicate key value violates unique constraint "profiles_username_key"',
      }),
    ).toEqual({ kind: "field", errors: { username: "usernameTaken" } });
  });

  it("reconhece quem já concluiu o cadastro", () => {
    expect(
      signupFailureFrom({
        code: "23505",
        message: 'duplicate key value violates unique constraint "consents_user_id_purpose_policy_version_key"',
      }),
    ).toEqual({ kind: "alreadySignedUp" });
  });

  it("aponta a cidade quando ela não existe", () => {
    expect(signupFailureFrom({ code: "23503", message: "violates foreign key" })).toEqual({
      kind: "field",
      errors: { city: "cityRequired" },
    });
  });

  it("cai numa mensagem genérica no resto", () => {
    expect(signupFailureFrom({ code: "XX000", message: "qualquer coisa" })).toEqual({ kind: "failed" });
  });
});
