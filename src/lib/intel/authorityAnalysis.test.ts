import { describe, expect, it } from "vitest";
import { buildAuthorityAnalysis, buildAuthoritySignals } from "./authorityAnalysis";
import type { MintInspection } from "./schemas";

function mint(overrides: Partial<MintInspection>): MintInspection {
  return {
    mintAddress: "So11111111111111111111111111111111111111112",
    accountExists: true,
    tokenProgram: "spl-token",
    decimals: 9,
    supply: {
      rawAmount: "1000",
      decimals: 9,
      uiAmountString: "0.000001",
    },
    mintAuthority: null,
    mintAuthorityRevoked: true,
    freezeAuthority: null,
    freezeAuthorityRevoked: true,
    ...overrides,
  };
}

describe("buildAuthorityAnalysis", () => {
  it("reports a legacy mint with active mint authority", () => {
    const analysis = buildAuthorityAnalysis(
      mint({
        mintAuthority: "MintAuthority111111111111111111111111111111",
        mintAuthorityRevoked: false,
      }),
    );

    expect(analysis.scope).toBe("legacy-spl-token");
    expect(analysis.standardAuthorities[0]).toMatchObject({
      id: "mint-authority",
      status: "active",
      address: "MintAuthority111111111111111111111111111111",
    });
    expect(analysis.standardAuthorities[0].permits).toContain("create additional token supply");
  });

  it("reports a legacy mint with revoked mint authority", () => {
    const analysis = buildAuthorityAnalysis(mint({ mintAuthorityRevoked: true }));

    expect(analysis.standardAuthorities[0]).toMatchObject({
      id: "mint-authority",
      status: "revoked",
      address: null,
    });
    expect(analysis.standardAuthorities[0].permits).toContain("cannot be minted");
  });

  it("reports a legacy mint with active freeze authority", () => {
    const analysis = buildAuthorityAnalysis(
      mint({
        freezeAuthority: "FreezeAuthority11111111111111111111111111",
        freezeAuthorityRevoked: false,
      }),
    );

    expect(analysis.standardAuthorities[1]).toMatchObject({
      id: "freeze-authority",
      status: "active",
      address: "FreezeAuthority11111111111111111111111111",
    });
    expect(analysis.standardAuthorities[1].permits).toContain("freeze token accounts");
  });

  it("reports a legacy mint with revoked freeze authority", () => {
    const analysis = buildAuthorityAnalysis(mint({ freezeAuthorityRevoked: true }));

    expect(analysis.standardAuthorities[1]).toMatchObject({
      id: "freeze-authority",
      status: "revoked",
      address: null,
    });
    expect(analysis.standardAuthorities[1].permits).toContain("cannot be frozen");
  });

  it("reports both authorities revoked", () => {
    const analysis = buildAuthorityAnalysis(
      mint({
        mintAuthority: null,
        mintAuthorityRevoked: true,
        freezeAuthority: null,
        freezeAuthorityRevoked: true,
      }),
    );

    expect(analysis.standardAuthorities.map((authority) => authority.status)).toEqual([
      "revoked",
      "revoked",
    ]);
  });

  it("reports both authorities active", () => {
    const analysis = buildAuthorityAnalysis(
      mint({
        mintAuthority: "MintAuthority111111111111111111111111111111",
        mintAuthorityRevoked: false,
        freezeAuthority: "FreezeAuthority11111111111111111111111111",
        freezeAuthorityRevoked: false,
      }),
    );

    expect(analysis.standardAuthorities.map((authority) => authority.status)).toEqual([
      "active",
      "active",
    ]);
  });

  it("reports unsupported malformed or non-mint account authority scope", () => {
    const analysis = buildAuthorityAnalysis(
      mint({
        tokenProgram: "unknown",
        mintAuthorityRevoked: null,
        freezeAuthorityRevoked: null,
      }),
    );

    expect(analysis.scope).toBe("unsupported");
    expect(analysis.standardAuthorities.map((authority) => authority.status)).toEqual([
      "unknown",
      "unknown",
    ]);
  });

  it("classifies Token-2022 and detects parsed authority-bearing extensions", () => {
    const analysis = buildAuthorityAnalysis({
      ...mint({
        tokenProgram: "token-2022",
        mintAuthorityRevoked: true,
        freezeAuthorityRevoked: true,
      }),
      extensions: [
        {
          extension: "permanentDelegate",
          state: {
            delegate: "Delegate111111111111111111111111111111111",
          },
        },
      ],
    });

    expect(analysis.scope).toBe("token-2022");
    expect(analysis.summary).toContain("not treated as safe by omission");
    expect(
      analysis.token2022Extensions.find(
        (extension) => extension.extension === "permanentDelegate",
      ),
    ).toMatchObject({
      status: "detected",
      authorityFields: [
        {
          field: "delegate",
          value: "Delegate111111111111111111111111111111111",
        },
      ],
    });
  });

  it("marks Token-2022 extension authority state as uninspected when no extensions are parsed", () => {
    const analysis = buildAuthorityAnalysis(
      mint({
        tokenProgram: "token-2022",
        mintAuthorityRevoked: true,
        freezeAuthorityRevoked: true,
      }),
    );

    expect(analysis.limitations.join(" ")).toContain("does not claim comprehensive Token-2022 authority coverage");
    expect(analysis.token2022Extensions.some((extension) => extension.status === "not-parsed-m2")).toBe(true);
  });
});

describe("buildAuthoritySignals", () => {
  it("does not emit safe or scam classifications", () => {
    const signals = buildAuthoritySignals(
      mint({
        tokenProgram: "token-2022",
        mintAuthorityRevoked: true,
        freezeAuthorityRevoked: true,
      }),
    );

    const text = JSON.stringify(signals).toLowerCase();
    expect(text).not.toContain("safe");
    expect(text).not.toContain("scam");
    expect(signals.some((signal) => signal.id === "token-2022-extension-authority-review-required")).toBe(true);
  });
});
