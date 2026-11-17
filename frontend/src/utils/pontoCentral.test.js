import { describe, expect, it } from "vitest";
import { pontoCentral } from "./pontoCentral";

describe("pontoCentral", () => {
  it("devolve o ponto do meio quando a quantidade é ímpar", () => {
    const g = [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }];
    expect(pontoCentral(g)).toEqual([1, 1]);
  });
  it("devolve a média dos dois do meio quando é par", () => {
    const g = [{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }];
    expect(pontoCentral(g)).toEqual([1, 2]);
  });
  it("funciona com um ponto só", () => {
    expect(pontoCentral([{ lat: -8.06, lng: -34.87 }])).toEqual([-8.06, -34.87]);
  });
});
