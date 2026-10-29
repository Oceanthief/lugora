import { describe, expect, it } from "vitest";

import {
  RATING_OPTIONS,
  toggleOccasion,
  validateVisitDraft,
  type VisitDraft,
} from "./visit-draft";

const today = "2026-10-28";
const valid: VisitDraft = {
  placeId: "p1",
  visitedOn: today,
  rating: 4.5,
  occasions: ["with_friends"],
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
      { placeId: "", visitedOn: "", rating: null, occasions: [] },
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
});
