import { describe, expect, it } from "vitest";

import { boundsOf } from "./map-config";

describe("boundsOf", () => {
  it("devolve o retângulo [[oeste, sul], [leste, norte]] que contém os pontos", () => {
    expect(
      boundsOf([
        [-43.35, -21.76],
        [-43.43, -21.69],
        [-43.3, -21.81],
      ]),
    ).toEqual([
      [-43.43, -21.81],
      [-43.3, -21.69],
    ]);
  });

  it("devolve null sem pontos", () => {
    expect(boundsOf([])).toBeNull();
  });
});
