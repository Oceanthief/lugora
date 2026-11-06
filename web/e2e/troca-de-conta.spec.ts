import { expect, test, type Page } from "@playwright/test";

import {
  chooseChip,
  choosePlace,
  completeSignup,
  goTo,
  newAccount,
  newEmail,
  placeField,
  signIn,
  signOut,
  visible,
} from "./helpers";

// Achados da revisão de privacidade da Fatia 3: num aparelho dividido, nada de quem saiu pode
// passar para quem entra. O Next mantém as telas vivas na memória, por isso estes testes.

/** Onde a pessoa A está. Se aparecer num pedido de B, a posição vazou. */
const POSITION_A = { latitude: -21.7625, longitude: -43.3503 };

test.use({ geolocation: POSITION_A, permissions: ["geolocation"] });

const enterLink = (page: Page) => visible(page.locator('a[href="/entrar"]')).first();

test("na mesma aba, a busca, o rascunho e a posição não passam para a pessoa seguinte", async ({ page }) => {
  await newAccount(page, "troca-a", { allowLocation: true });
  await goTo(page, "/registrar");
  await visible(page.getByRole("button", { name: "Usar minha localização" })).click();
  await expect(visible(page.getByText("Mostrando a distância até você"))).toBeVisible();
  await choosePlace(page, "teste e2e", "Padaria Teste E2E");
  await chooseChip(page, "2,0");

  await signOut(page);
  await enterLink(page).click();
  await signIn(page, newEmail("troca-b"), "/cadastro");
  await completeSignup(page, "troca-b", { allowLocation: true });
  await goTo(page, "/registrar");

  await expect(placeField(page)).toHaveValue("");
  await expect(page.getByRole("radio", { name: "2,0" })).not.toBeChecked();
  await expect(visible(page.getByRole("button", { name: "Usar minha localização" }))).toBeVisible();
  // Nem na tela, nem escondido na página.
  await expect(page.getByText("Padaria Teste E2E")).toHaveCount(0);
  await expect(page.getByText("Mostrando a distância até você")).toHaveCount(0);
  await expect(page.getByText("Pessoa troca-a")).toHaveCount(0);
});

test("uma aba antiga recarrega na primeira busca e não leva a posição de quem saiu", async ({ context }) => {
  const current = await context.newPage();
  await newAccount(current, "aba-a", { allowLocation: true });

  const old = await context.newPage();
  await old.goto("/registrar");
  await visible(old.getByRole("button", { name: "Usar minha localização" })).click();
  await expect(visible(old.getByText("Mostrando a distância até você"))).toBeVisible();
  await placeField(old).fill("teste e2e");
  await expect(visible(old.getByText(/de você/)).first()).toBeVisible();

  // Na outra aba, A sai e B entra.
  await current.bringToFront();
  await signOut(current);
  await enterLink(current).click();
  await signIn(current, newEmail("aba-b"), "/cadastro");
  await completeSignup(current, "aba-b", { allowLocation: true });

  // Na aba antiga, a primeira busca percebe que a sessão mudou e recarrega.
  await old.bringToFront();
  const reloaded = old.waitForEvent("load", { timeout: 15_000 });
  await placeField(old).fill("padaria");
  await reloaded;
  await expect(placeField(old)).toHaveValue("");
  await expect(old.getByText("Mostrando a distância até você")).toHaveCount(0);
  await expect(visible(old.getByRole("button", { name: "Usar minha localização" }))).toBeVisible();

  // A busca seguinte já é de B, e não manda a posição de A.
  const bodies: string[] = [];
  old.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/registrar")) bodies.push(request.postData() ?? "");
  });
  const answered = old.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().includes("/registrar"),
  );
  await placeField(old).fill("padaria teste");
  await answered;
  expect(bodies.join(" ")).not.toContain(String(POSITION_A.latitude));
  await expect(old.getByText(/de você/)).toHaveCount(0);
});

test("o cadastro pela metade não passa para a pessoa seguinte", async ({ page, context }) => {
  await signIn(page, newEmail("meio-x"), "/cadastro");
  await visible(page.getByLabel("Nome", { exact: true })).fill("Pessoa X Secreta");
  await visible(page.getByLabel("Seu @")).fill("pessoa_x_secreta");
  await visible(page.getByLabel("Cidade onde você mora")).fill("juiz");
  await visible(page.getByRole("button", { name: "Juiz de Fora, MG" })).click();

  // A sessão de X acaba sem passar pela tela (venceu, ou saiu em outra aba), e Y entra na mesma aba.
  await context.clearCookies();
  await goTo(page, "/perfil");
  await enterLink(page).click();
  await signIn(page, newEmail("meio-y"), "/cadastro");

  await expect(visible(page.getByRole("heading", { name: "Crie o seu perfil" }))).toBeVisible();
  await expect(visible(page.getByLabel("Nome", { exact: true }))).toHaveValue("");
  await expect(visible(page.getByLabel("Seu @"))).toHaveValue("");
  await expect(page.getByText("Pessoa X Secreta")).toHaveCount(0);
  await expect(page.getByText("Juiz de Fora, MG")).toHaveCount(0);
});
