/**
 * Regras do cadastro, sem rede nem banco: cobertas por signup.test.ts. O banco
 * repete as regras que importam (18+, aceite, formato do @), porque alguém pode
 * chamar a API sem passar por esta tela.
 */

export const NAME_MAX_LENGTH = 80;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const CITY_SEARCH_MIN_LENGTH = 2;

/** Finalidades opcionais (seção 9.1). O aceite essencial é a caixa da política. */
export const OPTIONAL_PURPOSES = ["precise_location", "emails", "analytics"] as const;
export type OptionalPurpose = (typeof OPTIONAL_PURPOSES)[number];

export type CityOption = {
  id: string;
  name: string;
  state: string;
};

export type SignupDraft = {
  name: string;
  username: string;
  cityId: string;
  ageConfirmed: boolean;
  policyAccepted: boolean;
  grantedPurposes: OptionalPurpose[];
};

export type SignupField = "name" | "username" | "city" | "ageConfirmed" | "policyAccepted";

export type SignupError =
  | "nameRequired"
  | "nameTooLong"
  | "usernameInvalid"
  | "usernameTaken"
  | "cityRequired"
  | "ageRequired"
  | "policyRequired";

export type SignupErrors = Partial<Record<SignupField, SignupError>>;

/** O que a tela mostra depois de um envio recusado. */
export type SignupState = {
  errors: SignupErrors;
  failed?: boolean;
  draft: SignupDraft;
};

export const initialSignupState: SignupState = {
  errors: {},
  draft: {
    name: "",
    username: "",
    cityId: "",
    ageConfirmed: false,
    policyAccepted: false,
    grantedPurposes: [],
  },
};

/** Ordem em que os campos aparecem: o foco vai para o primeiro com erro. */
export const SIGNUP_FIELDS: readonly SignupField[] = ["name", "username", "city", "ageConfirmed", "policyAccepted"];

/** Aceita "@Duda" e guarda "duda": o @ em si não faz parte do nome de usuário. */
export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return new RegExp(`^[a-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`).test(username);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateSignup(draft: SignupDraft): SignupErrors {
  const errors: SignupErrors = {};

  const name = draft.name.trim();
  if (!name) errors.name = "nameRequired";
  else if (name.length > NAME_MAX_LENGTH) errors.name = "nameTooLong";

  if (!isValidUsername(draft.username)) errors.username = "usernameInvalid";
  if (!UUID.test(draft.cityId)) errors.city = "cityRequired";
  if (!draft.ageConfirmed) errors.ageConfirmed = "ageRequired";
  if (!draft.policyAccepted) errors.policyAccepted = "policyRequired";

  return errors;
}

export function keepOptionalPurposes(values: readonly string[]): OptionalPurpose[] {
  return OPTIONAL_PURPOSES.filter((purpose) => values.includes(purpose));
}

/** O que fazer com o erro que o banco devolveu em complete_signup. */
export type SignupFailure =
  | { kind: "field"; errors: SignupErrors }
  | { kind: "alreadySignedUp" }
  | { kind: "failed" };

export function signupFailureFrom(error: { code?: string; message?: string }): SignupFailure {
  const message = error.message ?? "";

  if (message === "age_confirmation_required") return { kind: "field", errors: { ageConfirmed: "ageRequired" } };
  if (message === "policy_acceptance_required") return { kind: "field", errors: { policyAccepted: "policyRequired" } };

  // Valor repetido: ou o @ já tem dono, ou esta pessoa já concluiu o cadastro.
  if (error.code === "23505") {
    return message.includes("profiles_username_key")
      ? { kind: "field", errors: { username: "usernameTaken" } }
      : { kind: "alreadySignedUp" };
  }
  if (error.code === "23514") {
    if (message.includes("profiles_username_check")) return { kind: "field", errors: { username: "usernameInvalid" } };
    if (message.includes("profiles_name_check")) return { kind: "field", errors: { name: "nameRequired" } };
  }
  // A cidade não existe, ou o identificador está malformado.
  if (error.code === "23503" || error.code === "22P02") return { kind: "field", errors: { city: "cityRequired" } };

  return { kind: "failed" };
}
