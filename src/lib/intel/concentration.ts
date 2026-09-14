import type { ConcentrationReport, MintInspection } from "./schemas";

export type OwnerResolutionStatus = "resolved" | "unresolved";
export type ResolutionQuality = "complete" | "partial" | "unavailable";

export type LargestTokenAccountInput = {
  tokenAccountAddress: string;
  rawAmount: string;
  uiAmountString: string | null;
  decimals: number;
  ownerAddress?: string | null;
  resolutionStatus: OwnerResolutionStatus;
};

const RELIABILITY_THRESHOLD_BPS = 8000n;

function parseRawAmount(rawAmount: string): bigint | null {
  try {
    if (!/^\d+$/.test(rawAmount)) {
      return null;
    }

    return BigInt(rawAmount);
  } catch {
    return null;
  }
}

export function formatPercentFromRaw(rawAmount: string, supplyRawAmount: string): string | null {
  const amount = parseRawAmount(rawAmount);
  const supply = parseRawAmount(supplyRawAmount);

  if (amount === null || supply === null || supply === 0n) {
    return null;
  }

  const scaled = (amount * 100n * 10000n) / supply;
  const whole = scaled / 10000n;
  const fractional = (scaled % 10000n).toString().padStart(4, "0");

  return `${whole}.${fractional}`;
}

function sumRawAmounts(rawAmounts: string[]): string | null {
  let total = 0n;

  for (const rawAmount of rawAmounts) {
    const parsed = parseRawAmount(rawAmount);
    if (parsed === null) {
      return null;
    }

    total += parsed;
  }

  return total.toString();
}

function topPercent(accounts: LargestTokenAccountInput[], count: number, supplyRawAmount: string): string | null {
  const sum = sumRawAmounts(accounts.slice(0, count).map((account) => account.rawAmount));
  return sum === null ? null : formatPercentFromRaw(sum, supplyRawAmount);
}

function qualityFromCounts(resolved: number, inspected: number): ResolutionQuality {
  if (inspected === 0 || resolved === 0) {
    return "unavailable";
  }

  if (resolved === inspected) {
    return "complete";
  }

  return "partial";
}

function isResolutionReliable(
  quality: ResolutionQuality,
  resolvedAccountPercentBps: bigint,
  sampledBalanceResolvedPercentBps: bigint,
): boolean {
  if (quality === "complete") {
    return true;
  }

  return (
    quality === "partial" &&
    resolvedAccountPercentBps >= RELIABILITY_THRESHOLD_BPS &&
    sampledBalanceResolvedPercentBps >= RELIABILITY_THRESHOLD_BPS
  );
}

function formatBps(bps: bigint): string {
  const whole = bps / 100n;
  const fractional = (bps % 100n).toString().padStart(2, "0");

  return `${whole}.${fractional}`;
}

export function buildConcentrationReport(
  mint: MintInspection,
  largestAccounts: LargestTokenAccountInput[],
): ConcentrationReport {
  const supplyRawAmount = mint.supply?.rawAmount ?? null;
  const supply = supplyRawAmount ? parseRawAmount(supplyRawAmount) : null;

  if (!supplyRawAmount || supply === null) {
    return {
      status: "unavailable",
      methodology:
        "Concentration requires a valid raw mint supply and read-only largest-token-account RPC data.",
      tokenAccountConcentration: null,
      resolvedOwnerConcentration: null,
      resolution: {
        quality: "unavailable",
        accountsInspected: 0,
        accountsResolved: 0,
        accountsUnresolved: 0,
        sampledRawBalance: "0",
        sampledSupplyPercent: null,
        resolvedAccountPercent: "0.00",
        sampledBalanceResolvedPercent: "0.00",
      },
      limitations: [
        "Concentration could not be calculated because supply data was unavailable or malformed.",
      ],
    };
  }

  const sampledRawBalance = sumRawAmounts(largestAccounts.map((account) => account.rawAmount));
  if (sampledRawBalance === null) {
    return {
      status: "unavailable",
      methodology:
        "Concentration requires integer raw token amounts from RPC. Malformed balances are not coerced.",
      tokenAccountConcentration: null,
      resolvedOwnerConcentration: null,
      resolution: {
        quality: "unavailable",
        accountsInspected: largestAccounts.length,
        accountsResolved: 0,
        accountsUnresolved: largestAccounts.length,
        sampledRawBalance: "0",
        sampledSupplyPercent: null,
        resolvedAccountPercent: "0.00",
        sampledBalanceResolvedPercent: "0.00",
      },
      limitations: ["Concentration could not be calculated because at least one RPC balance was malformed."],
    };
  }

  if (supply === 0n) {
    return {
      status: "zero-supply",
      methodology:
        "Concentration percentages use current mint supply as the denominator. Zero supply cannot produce meaningful percentages.",
      tokenAccountConcentration: {
        top5Percent: null,
        top10Percent: null,
        top20Percent: null,
        accounts: largestAccounts.map((account) => ({
          ...account,
          percentOfSupply: null,
        })),
      },
      resolvedOwnerConcentration: null,
      resolution: {
        quality: "unavailable",
        accountsInspected: largestAccounts.length,
        accountsResolved: 0,
        accountsUnresolved: largestAccounts.length,
        sampledRawBalance,
        sampledSupplyPercent: null,
        resolvedAccountPercent: "0.00",
        sampledBalanceResolvedPercent: "0.00",
      },
      limitations: ["Current mint supply is zero, so concentration percentages are not meaningful."],
    };
  }

  const resolvedAccounts = largestAccounts.filter(
    (account) => account.resolutionStatus === "resolved" && account.ownerAddress,
  );
  const unresolvedAccounts = largestAccounts.length - resolvedAccounts.length;
  const resolvedRawBalance = sumRawAmounts(resolvedAccounts.map((account) => account.rawAmount)) ?? "0";
  const accountsInspectedBps =
    largestAccounts.length === 0
      ? 0n
      : (BigInt(resolvedAccounts.length) * 10000n) / BigInt(largestAccounts.length);
  const resolvedBalanceBps =
    sampledRawBalance === "0" ? 0n : (BigInt(resolvedRawBalance) * 10000n) / BigInt(sampledRawBalance);
  const quality = qualityFromCounts(resolvedAccounts.length, largestAccounts.length);
  const reliableOwnerMetrics = isResolutionReliable(quality, accountsInspectedBps, resolvedBalanceBps);

  const ownerBalances = new Map<string, { ownerAddress: string; rawAmount: bigint; tokenAccountCount: number }>();
  for (const account of resolvedAccounts) {
    const ownerAddress = account.ownerAddress;
    const amount = parseRawAmount(account.rawAmount);

    if (!ownerAddress || amount === null) {
      continue;
    }

    const existing = ownerBalances.get(ownerAddress);
    if (existing) {
      existing.rawAmount += amount;
      existing.tokenAccountCount += 1;
    } else {
      ownerBalances.set(ownerAddress, {
        ownerAddress,
        rawAmount: amount,
        tokenAccountCount: 1,
      });
    }
  }

  const owners = Array.from(ownerBalances.values())
    .sort((left, right) => {
      if (left.rawAmount === right.rawAmount) {
        return left.ownerAddress.localeCompare(right.ownerAddress);
      }

      return left.rawAmount > right.rawAmount ? -1 : 1;
    })
    .map((owner) => {
      const rawAmount = owner.rawAmount.toString();
      return {
        ownerAddress: owner.ownerAddress,
        rawAmount,
        tokenAccountCount: owner.tokenAccountCount,
        percentOfSupply: formatPercentFromRaw(rawAmount, supplyRawAmount),
      };
    });

  return {
    status: largestAccounts.length > 0 ? "available" : "unavailable",
    methodology:
      "Concentration uses read-only getTokenLargestAccounts data, raw integer balances, current mint supply as denominator, and separately aggregates resolved token-account owners when resolution quality is sufficient.",
    tokenAccountConcentration: {
      top5Percent: topPercent(largestAccounts, 5, supplyRawAmount),
      top10Percent: topPercent(largestAccounts, 10, supplyRawAmount),
      top20Percent: topPercent(largestAccounts, 20, supplyRawAmount),
      accounts: largestAccounts.map((account) => ({
        ...account,
        percentOfSupply: formatPercentFromRaw(account.rawAmount, supplyRawAmount),
      })),
    },
    resolvedOwnerConcentration: {
      quality,
      metricsReliable: reliableOwnerMetrics,
      top5Percent: reliableOwnerMetrics ? topPercent(owners.map((owner) => ({
        tokenAccountAddress: owner.ownerAddress,
        rawAmount: owner.rawAmount,
        uiAmountString: null,
        decimals: mint.decimals ?? 0,
        ownerAddress: owner.ownerAddress,
        resolutionStatus: "resolved",
      })), 5, supplyRawAmount) : null,
      top10Percent: reliableOwnerMetrics ? topPercent(owners.map((owner) => ({
        tokenAccountAddress: owner.ownerAddress,
        rawAmount: owner.rawAmount,
        uiAmountString: null,
        decimals: mint.decimals ?? 0,
        ownerAddress: owner.ownerAddress,
        resolutionStatus: "resolved",
      })), 10, supplyRawAmount) : null,
      top20Percent: reliableOwnerMetrics ? topPercent(owners.map((owner) => ({
        tokenAccountAddress: owner.ownerAddress,
        rawAmount: owner.rawAmount,
        uiAmountString: null,
        decimals: mint.decimals ?? 0,
        ownerAddress: owner.ownerAddress,
        resolutionStatus: "resolved",
      })), 20, supplyRawAmount) : null,
      owners,
    },
    resolution: {
      quality,
      accountsInspected: largestAccounts.length,
      accountsResolved: resolvedAccounts.length,
      accountsUnresolved: unresolvedAccounts,
      sampledRawBalance,
      sampledSupplyPercent: formatPercentFromRaw(sampledRawBalance, supplyRawAmount),
      resolvedAccountPercent: formatBps(accountsInspectedBps),
      sampledBalanceResolvedPercent: formatBps(resolvedBalanceBps),
    },
    limitations: [
      "getTokenLargestAccounts returns a sample of the largest token accounts, not every token account.",
      "Token-account concentration is not the same as unique owner concentration.",
      "Resolved owners are blockchain owner addresses, not verified people or real-world entities.",
      "Program-controlled accounts, exchanges, custodians, treasuries, bridges, vesting programs, and liquidity pools may distort naive interpretations.",
      "M4 does not guess entity labels. Unknown remains unknown.",
      "Concentration affects the XGEN Intel Score only through documented M4 resolved-owner scoring rules when metrics are reliable.",
    ],
  };
}
