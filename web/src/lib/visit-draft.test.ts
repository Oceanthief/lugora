import { describe, expect, it } from "vitest";

import {
  defaultVisibilityFor,
  parseVisitDraft,
  RATING_OPTIONS,
  toggleOccasion,
  validateVisitDraft,
  visitErrorsFromDatabase,
  type VisitDraft,
} from "./visit-draft";

const today = "2026-10-28";
const placeId = "6f1c2c84-3d5e-4b8e-9a51-2a8f0f1e7b10";
const valid: VisitDraft = {
  placeId,
  visitedOn: today,
  rating: 4.5,
  occasions: ["with_friends"],
  visibility: null,
};

describe("validateVisitDraft", () => {
  it("aceita um registro com lugar, data e nota", () => {
    expect(validateVisitDraft(valid, today)).toEqual({});
  });

  it("aceita um registro sem ocasiões", () => {
    expect(validateVisitDraft({ ...valid, occasions: [] }, today)).toEqual({});
  });

  it("exige lugar, data e nota", () => {
    const errors = validateVisitDraft(
      { placeId: "", visitedOn: "", rating: null, occasions: [], visibility: null },
      today,
    );
    expect(errors).toEqual({
      placeId: "placeRequired",
      visitedOn: "dateRequired",
      rating: "ratingRequired",
    });
  });

  it("recusa data no futuro", () => {
    const errors = validateVisitDraft({ ...valid, visitedOn: "2026-10-29" }, today);
    expect(errors.visitedOn).toBe("dateInFuture");
  });

  it("recusa nota fora dos passos de 0,5", () => {
    expect(validateVisitDraft({ ...valid, rating: 4.2 }, today).rating).toBe("ratingInvalid");
    expect(validateVisitDraft({ ...valid, rating: 0 }, today).rating).toBe("ratingInvalid");
  });

  it("recusa mais de 3 ocasiões", () => {
    const errors = validateVisitDraft(
      { ...valid, occasions: ["romantic", "with_friends", "solo", "work_study"] },
      today,
    );
    expect(errors.occasions).toBe("tooManyOccasions");
  });

  it("usa o limite que vem do banco", () => {
    const errors = validateVisitDraft({ ...valid, occasions: ["romantic", "solo"] }, today, 1);
    expect(errors.occasions).toBe("tooManyOccasions");
  });
});

describe("RATING_OPTIONS", () => {
  it("vai de 0,5 a 5 em passos de 0,5", () => {
    expect(RATING_OPTIONS).toEqual([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
  });
});

describe("toggleOccasion", () => {
  it("marca e desmarca", () => {
    const marked = toggleOccasion([], "solo");
    expect(marked).toEqual(["solo"]);
    expect(toggleOccasion(marked, "solo")).toEqual([]);
  });

  it("não passa de 3 ocasiões", () => {
    const full = ["romantic", "with_friends", "solo"] as const;
    expect(toggleOccasion(full, "work_study")).toEqual(full);
  });

  it("não passa do limite que vem do banco", () => {
    expect(toggleOccasion(["solo"], "romantic", 1)).toEqual(["solo"]);
  });
});

describe("defaultVisibilityFor", () => {
  it("antes de escolher o lugar, mostra o padrão do perfil", () => {
    expect(defaultVisibilityFor(null, "public")).toBe("public");
  });

  it("lugar comum segue o padrão do perfil", () => {
    expect(defaultVisibilityFor({ isSensitive: false }, "followers")).toBe("followers");
  });

  it("lugar sensível nasce só eu, qualquer que seja o padrão", () => {
    expect(defaultVisibilityFor({ isSensitive: true }, "public")).toBe("private");
  });
});

describe("visitErrorsFromDatabase", () => {
  it.each([
    ["place_not_found", { placeId: "placeUnavailable" }],
    ["place_not_visitable", { placeId: "placeUnavailable" }],
    ["visited_on_in_future", { visitedOn: "dateInFuture" }],
    ["too_many_tags", { occasions: "tooManyOccasions" }],
  ])("%s volta para o campo certo", (message, expected) => {
    expect(visitErrorsFromDatabase(message)).toEqual(expected);
  });

  it("o resto vira falha genérica", () => {
    expect(visitErrorsFromDatabase("not_your_visit")).toBeNull();
    expect(visitErrorsFromDatabase(undefined)).toBeNull();
  });
});

describe("parseVisitDraft", () => {
  it("aceita o que a tela manda", () => {
    expect(parseVisitDraft(valid)).toEqual(valid);
  });

  it("aceita uma visibilidade escolhida", () => {
    expect(parseVisitDraft({ ...valid, visibility: "private" })?.visibility).toBe("private");
  });

  it("tira ocasiões repetidas", () => {
    expect(parseVisitDraft({ ...valid, occasions: ["solo", "solo"] })?.occasions).toEqual(["solo"]);
  });

  it.each([
    ["sem objeto", null],
    ["lugar que não é um id", { ...valid, placeId: "1; drop table" }],
    ["data em outro formato", { ...valid, visitedOn: "28/10/2026" }],
    ["nota em texto", { ...valid, rating: "4,5" }],
    ["ocasião inventada", { ...valid, occasions: ["inventada"] }],
    ["ocasiões fora de uma lista", { ...valid, occasions: "solo" }],
    ["visibilidade inventada", { ...valid, visibility: "amigos" }],
  ])("recusa %s", (_, input) => {
    expect(parseVisitDraft(input)).toBeNull();
  });
});
