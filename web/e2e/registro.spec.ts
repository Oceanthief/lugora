import { expect, test } from "@playwright/test";

import { brDate, chooseChip, choosePlace, goTo, newAccount, profileNumber, visible } from "./helpers";

// Fatia 4: o registro rápido de verdade, do toque em Registrar até o mapa.
test.describe("registro rápido", () => {
  test("registra uma visita do começo ao fim, e duas visitas ao mesmo lugar contam 1 lugar", async ({ page }) => {
    await newAccount(page, "registro");
    await expect(profileNumber(page, "Lugares")).toHaveText("0");

    // Aceite: do toque em Registrar até salvar, menos de 20 s. Aqui é só o tempo do app;
    // o tempo de uma pessoa de verdade é cronometrado no celular e registrado no PR.
    const started = Date.now();
    await goTo(page, "/registrar");
    await choosePlace(page, "lanchonete teste e2e", "Lanchonete Teste E2E");
    // Sem mexer, vale o padrão do perfil: pública.
    await expect(page.getByRole("radio", { name: "Pública" })).toBeChecked();
    await chooseChip(page, "4,5");
    await chooseChip(page, "Com amigos");
    await visible(page.getByRole("button", { name: "Salvar visita" })).click();

    const saved = page.getByRole("region", { name: "Visita salva" });
    await expect(saved).toContainText("Pública: aparece para todo mundo no Lugora.");
    expect(Date.now() - started).toBeLessThan(20_000);

    // Minha cidade: aparece para os outros 24 h depois (seção 7.5). Só a data, nunca a hora.
    await expect(saved).toContainText(`Aparece para os outros a partir de ${brDate(1)}.`);
    await expect(saved).not.toContainText(/\d{1,2}:\d{2}/);

    // "Publicar agora" pede confirmação, com o aviso de segurança.
    await saved.getByRole("button", { name: "Publicar agora" }).click();
    await expect(saved.getByRole("alert")).toContainText("Publicar agora mostra que você esteve aqui hoje");
    await saved.getByRole("button", { name: "Sim, publicar agora" }).click();
    await expect(saved).toContainText("Já aparece para os outros.");

    // De novo no mesmo lugar, com outra nota.
    await saved.getByRole("button", { name: "Registrar outra visita" }).click();
    await choosePlace(page, "lanchonete teste e2e", "Lanchonete Teste E2E");
    await chooseChip(page, "3,0");
    await visible(page.getByRole("button", { name: "Salvar visita" })).click();
    await expect(page.getByRole("region", { name: "Visita salva" })).toBeVisible();

    // Aceite: duas visitas ao mesmo lugar contam 1 lugar distinto.
    await goTo(page, "/perfil");
    await expect(profileNumber(page, "Lugares")).toHaveText("1");
    await expect(profileNumber(page, "Visitas")).toHaveText("2");
    await expect(profileNumber(page, "Cidades")).toHaveText("1");

    await goTo(page, "/mapa");
    await expect(page.getByRole("button", { name: "Minha cidade" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Ver lista" }).click();
    const list = page.locator("#map-list");
    await expect(list).toContainText("Juiz de Fora, MG");
    await expect(list).toContainText("1 lugar");
    await expect(list).toContainText("2 visitas");
    // A nota do lugar é a da visita mais recente (seção 7.1).
    await expect(list).toContainText("Nota 3,0");
    await expect(list.getByText("Lanchonete Teste E2E")).toHaveCount(1);
  });

  test("lugar sensível nasce só eu", async ({ page }) => {
    await newAccount(page, "sensivel");
    await goTo(page, "/registrar");
    await choosePlace(page, "hospital teste e2e", "Hospital Teste E2E");

    // Teste 5 da seção 9.5: sem mexer na visibilidade, a visita nasce "só eu".
    await expect(page.getByRole("radio", { name: "Só eu" })).toBeChecked();
    await expect(visible(page.getByText("a visita nasce “só eu”", { exact: false }))).toBeVisible();
    await chooseChip(page, "4,0");
    await visible(page.getByRole("button", { name: "Salvar visita" })).click();

    const saved = page.getByRole("region", { name: "Visita salva" });
    await expect(saved).toContainText("Só eu: ninguém além de você vê.");
    // Uma visita "só eu" não aparece para ninguém, então não há o que publicar.
    await expect(saved.getByRole("button", { name: "Publicar agora" })).toHaveCount(0);
  });
});
