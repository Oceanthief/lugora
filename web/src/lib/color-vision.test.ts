import { describe, expect, it } from "vitest";

import { simulateColorVision } from "./color-vision";

describe("simulateColorVision", () => {
  it("não muda preto nem branco", () => {
    for (const vision of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as const) {
      expect(simulateColorVision("#000000", vision)).toBe("#000000");
      expect(simulateColorVision("#FFFFFF", vision)).toBe("#FFFFFF");
    }
  });

  it("deixa vermelho e verde parecidos para quem tem deuteranopia", () => {
    const red = simulateColorVision("#D62728", "deuteranopia");
    const green = simulateColorVision("#2CA02C", "deuteranopia");
    // Os dois perdem a diferença de matiz e viram tons de amarelo-oliva.
    expect(Number.parseInt(red.slice(1, 3), 16)).toBeGreaterThan(Number.parseInt(red.slice(5, 7), 16));
    expect(Number.parseInt(green.slice(1, 3), 16)).toBeGreaterThan(Number.parseInt(green.slice(5, 7), 16));
  });

  it("transforma em cinza na acromatopsia", () => {
    const grey = simulateColorVision("#AC530A", "achromatopsia");
    expect(grey.slice(1, 3)).toBe(grey.slice(3, 5));
    expect(grey.slice(3, 5)).toBe(grey.slice(5, 7));
  });
});
