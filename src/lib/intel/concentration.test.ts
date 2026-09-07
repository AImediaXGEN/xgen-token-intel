import { describe, expect, it } from "vitest";
import { calculateM1Score } from "./scoring";
import { buildConcentrationReport, formatPercentFromRaw, type LargestTokenAccountInput } from "./concentration";
import type { MintInspection } from "./schemas";

function mint(rawSupply = "1000"): MintInspection {
  return {
    mintAddress: "Mint111111111111111111111111111111111111111",
    accountExists: true,
    tokenProgram: "spl-token",
    decimals: 0,
    supply: {
      rawAmount: rawSupply,
      decimals: 0,
      uiAmountString: rawSupply,
    },
    mintAuthority: null,
    mintAuthorityRevoked: true,
    freezeAuthority: null,
    freezeAuthorityRevoked: true,
  };
}

function account(
  index: number,
  rawAmount: string,
  ownerAddress: string | null = `Owner${index}`,
): LargestTokenAccountInput {
  return {
    tokenAccountAddress: `TokenAccount${index}`,
    rawAmount,
    uiAmountString: rawAmount,
    decimals: 0,
    ownerAddress,
    resolutionStatus: ownerAddress ? "resolved" : "unresolved",
  };
}

describe("formatPercentFromRaw", () => {
  it("calculates percentages from raw integer amounts", () => {
    expect(formatPercentFromRaw("312", "1000")).toBe("31.2000");
  });

  it("handles zero supply safely", () => {
    expect(formatPercentFromRaw("1", "0")).toBeNull();
  });

  it("handles very large raw token amounts without precision loss", () => {
    expect(formatPercentFromRaw("999999999999999999999999", "1000000000000000000000000")).toBe("99.9999");
  });
});

describe("buildConcentrationReport", () => {
  it("calculates Top 5 aggregation", () => {
    const report = buildConcentrationReport(mint(), [
      account(1, "100"),
      account(2, "90"),
      account(3, "80"),
      account(4, "70"),
      account(5, "60"),
      account(6, "50"),
    ]);

    expect(report.tokenAccountConcentration?.top5Percent).toBe("40.0000");
  });

  it("calculates Top 10 aggregation", () => {
    const report = buildConcentrationReport(
      mint("1000"),
      Array.from({ length: 12 }, (_, index) => account(index + 1, "10")),
    );

    expect(report.tokenAccountConcentration?.top10Percent).toBe("10.0000");
  });

  it("calculates Top 20 aggregation", () => {
    const report = buildConcentrationReport(
      mint("1000"),
      Array.from({ length: 20 }, (_, index) => account(index + 1, "5")),
    );

    expect(report.tokenAccountConcentration?.top20Percent).toBe("10.0000");
  });

  it("handles fewer than 20 accounts", () => {
    const report = buildConcentrationReport(mint("1000"), [account(1, "100"), account(2, "50")]);

    expect(report.resolution.accountsInspected).toBe(2);
    expect(report.tokenAccountConcentration?.top20Percent).toBe("15.0000");
  });

  it("aggregates duplicate token accounts belonging to one owner", () => {
    const report = buildConcentrationReport(mint("1000"), [
      account(1, "100", "OwnerA"),
      account(2, "75", "OwnerA"),
      account(3, "25", "OwnerB"),
    ]);

    expect(report.resolvedOwnerConcentration?.owners[0]).toMatchObject({
      ownerAddress: "OwnerA",
      rawAmount: "175",
      tokenAccountCount: 2,
      percentOfSupply: "17.5000",
    });
  });

  it("aggregates multiple owners", () => {
    const report = buildConcentrationReport(mint("1000"), [
      account(1, "100", "OwnerA"),
      account(2, "75", "OwnerB"),
      account(3, "25", "OwnerC"),
    ]);

    expect(report.resolvedOwnerConcentration?.owners.map((owner) => owner.ownerAddress)).toEqual([
      "OwnerA",
      "OwnerB",
      "OwnerC",
    ]);
  });

  it("keeps unresolved owners visible", () => {
    const report = buildConcentrationReport(mint("1000"), [
      account(1, "100", "OwnerA"),
      account(2, "50", null),
    ]);

    expect(report.tokenAccountConcentration?.accounts[1]).toMatchObject({
      ownerAddress: null,
      resolutionStatus: "unresolved",
    });
    expect(report.resolution.accountsUnresolved).toBe(1);
  });

  it("reports partial owner resolution", () => {
    const report = buildConcentrationReport(mint("1000"), [
      account(1, "100", "OwnerA"),
      account(2, "90", "OwnerB"),
      account(3, "80", "OwnerC"),
      account(4, "70", "OwnerD"),
      account(5, "10", null),
    ]);

    expect(report.resolution.quality).toBe("partial");
    expect(report.resolvedOwnerConcentration?.metricsReliable).toBe(true);
  });

  it("reports owner resolution unavailable", () => {
    const report = buildConcentrationReport(mint("1000"), [
      account(1, "100", null),
      account(2, "90", null),
    ]);

    expect(report.resolution.quality).toBe("unavailable");
    expect(report.resolvedOwnerConcentration?.metricsReliable).toBe(false);
    expect(report.resolvedOwnerConcentration?.top5Percent).toBeNull();
  });

  it("rejects malformed RPC balances without coercion", () => {
    const report = buildConcentrationReport(mint("1000"), [account(1, "not-a-number", "OwnerA")]);

    expect(report.status).toBe("unavailable");
    expect(report.limitations.join(" ")).toContain("malformed");
  });

  it("does not alter the M4 score", () => {
    const scoreBefore = calculateM1Score(null);
    buildConcentrationReport(mint("1000"), [account(1, "100", "OwnerA")]);
    const scoreAfter = calculateM1Score(null);

    expect(scoreAfter).toEqual(scoreBefore);
  });

  it("does not claim unique people or holder identities", () => {
    const report = buildConcentrationReport(mint("1000"), [account(1, "100", "OwnerA")]);
    const text = JSON.stringify(report).toLowerCase();

    expect(text).not.toContain("verified person");
    expect(text).not.toContain("top holder");
  });

  it("does not guess entities", () => {
    const report = buildConcentrationReport(mint("1000"), [account(1, "100", "OwnerA")]);
    const text = JSON.stringify(report).toLowerCase();

    expect(text).not.toContain("probably");
    expect(text).not.toContain("likely");
    expect(text).not.toContain("whale");
    expect(text).not.toContain("developer wallet");
  });
});
