import type {
  AuthorityAnalysis,
  MintInspection,
  ObservableSignal,
  Token2022ExtensionAuthority,
} from "./schemas";

type ParsedTokenExtension = {
  extension: string;
  state?: Record<string, unknown>;
};

export type ParsedMintAuthorityInput = {
  tokenProgram: MintInspection["tokenProgram"];
  mintAuthority: string | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthority: string | null;
  freezeAuthorityRevoked: boolean | null;
  extensions?: ParsedTokenExtension[];
};

const TOKEN_2022_AUTHORITY_EXTENSION_FIELDS: Record<
  string,
  { label: string; fields: string[]; explanation: string }
> = {
  transferFeeConfig: {
    label: "Transfer fee configuration",
    fields: ["transferFeeConfigAuthority", "withdrawWithheldAuthority"],
    explanation:
      "Token-2022 transfer fee configuration can include authorities that modify fee settings or withdraw withheld fees.",
  },
  mintCloseAuthority: {
    label: "Mint close authority",
    fields: ["closeAuthority"],
    explanation:
      "Token-2022 can allow a mint account to be closed when supply is zero if a close authority is configured.",
  },
  permanentDelegate: {
    label: "Permanent delegate",
    fields: ["delegate"],
    explanation:
      "A Token-2022 permanent delegate can transfer or burn tokens from accounts for the mint under program rules.",
  },
  transferHook: {
    label: "Transfer hook",
    fields: ["authority", "programId"],
    explanation:
      "A Token-2022 transfer hook can route transfers through a configured program, adding transfer-time control logic.",
  },
  metadataPointer: {
    label: "Metadata pointer",
    fields: ["authority", "metadataAddress"],
    explanation:
      "A Token-2022 metadata pointer can include an authority that changes the canonical metadata address.",
  },
  tokenMetadata: {
    label: "Token metadata",
    fields: ["updateAuthority"],
    explanation:
      "Token-2022 token metadata can include an update authority for metadata fields.",
  },
  groupPointer: {
    label: "Group pointer",
    fields: ["authority", "groupAddress"],
    explanation:
      "A Token-2022 group pointer can include an authority that changes the canonical group account address.",
  },
  tokenGroup: {
    label: "Token group",
    fields: ["updateAuthority"],
    explanation:
      "Token-2022 token group data can include an update authority for group configuration.",
  },
  groupMemberPointer: {
    label: "Group member pointer",
    fields: ["authority", "memberAddress"],
    explanation:
      "A Token-2022 group member pointer can include an authority that changes the canonical member account address.",
  },
  tokenGroupMember: {
    label: "Token group member",
    fields: ["updateAuthority"],
    explanation:
      "Token-2022 token group member data can include an update authority for member configuration.",
  },
  interestBearingConfig: {
    label: "Interest-bearing configuration",
    fields: ["rateAuthority"],
    explanation:
      "Token-2022 interest-bearing configuration can include an authority that updates the displayed interest rate.",
  },
  scaledUiAmountConfig: {
    label: "Scaled UI amount configuration",
    fields: ["authority"],
    explanation:
      "Token-2022 scaled UI amount configuration can include an authority that updates the displayed UI multiplier.",
  },
  pausableConfig: {
    label: "Pausable configuration",
    fields: ["authority"],
    explanation:
      "Token-2022 pausable configuration can include an authority that pauses or resumes minting, burning, and transfers.",
  },
  permissionedBurnConfig: {
    label: "Permissioned burn configuration",
    fields: ["authority", "burnAuthority"],
    explanation:
      "Token-2022 permissioned burn configuration can require a burn authority co-signature for burns.",
  },
  confidentialTransferMint: {
    label: "Confidential transfer mint",
    fields: ["authority", "auditorElGamalPubkey"],
    explanation:
      "Token-2022 confidential transfer mint configuration can include authority and auditor-related control fields.",
  },
  confidentialMintBurn: {
    label: "Confidential mint/burn",
    fields: ["authority", "supplyElGamalPubkey"],
    explanation:
      "Token-2022 confidential mint/burn can introduce confidential supply controls that require dedicated extension parsing.",
  },
};

const TOKEN_2022_EXTENSION_INVENTORY = Object.keys(TOKEN_2022_AUTHORITY_EXTENSION_FIELDS);

function authorityStatus(revoked: boolean | null): "active" | "revoked" | "unknown" {
  if (revoked === true) {
    return "revoked";
  }

  if (revoked === false) {
    return "active";
  }

  return "unknown";
}

function displayValue(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function standardAuthoritySignals(mint: MintInspection): ObservableSignal[] {
  const signals: ObservableSignal[] = [];

  if (mint.mintAuthorityRevoked === true) {
    signals.push({
      id: "mint-authority-revoked-observed",
      label: "Mint authority revoked",
      severity: "positive",
      condition: "Parsed mint data reports no mint authority.",
      whyItMatters:
        "Additional supply cannot be minted through the standard mint authority.",
      source: "getParsedAccountInfo.parsed.info.mintAuthority",
    });
  } else if (mint.mintAuthorityRevoked === false) {
    signals.push({
      id: "mint-authority-active-observed",
      label: "Mint authority active",
      severity: "caution",
      condition: "Parsed mint data reports an active mint authority.",
      whyItMatters:
        "This authority can create additional token supply through the standard mint authority.",
      source: "getParsedAccountInfo.parsed.info.mintAuthority",
    });
  }

  if (mint.freezeAuthorityRevoked === true) {
    signals.push({
      id: "freeze-authority-revoked-observed",
      label: "Freeze authority revoked",
      severity: "positive",
      condition: "Parsed mint data reports no freeze authority.",
      whyItMatters:
        "Token accounts cannot be frozen through the standard freeze authority.",
      source: "getParsedAccountInfo.parsed.info.freezeAuthority",
    });
  } else if (mint.freezeAuthorityRevoked === false) {
    signals.push({
      id: "freeze-authority-active-observed",
      label: "Freeze authority active",
      severity: "caution",
      condition: "Parsed mint data reports an active freeze authority.",
      whyItMatters:
        "This authority can freeze token accounts under standard token program rules.",
      source: "getParsedAccountInfo.parsed.info.freezeAuthority",
    });
  }

  return signals;
}

export function buildAuthorityAnalysis(input: ParsedMintAuthorityInput): AuthorityAnalysis {
  const standardAuthorities = [
    {
      id: "mint-authority",
      label: "Mint authority",
      status: authorityStatus(input.mintAuthorityRevoked),
      address: input.mintAuthority,
      permits:
        input.mintAuthorityRevoked === true
          ? "Additional supply cannot be minted through the standard mint authority."
          : "An active mint authority can create additional token supply.",
      source: "getParsedAccountInfo.parsed.info.mintAuthority",
    },
    {
      id: "freeze-authority",
      label: "Freeze authority",
      status: authorityStatus(input.freezeAuthorityRevoked),
      address: input.freezeAuthority,
      permits:
        input.freezeAuthorityRevoked === true
          ? "Token accounts cannot be frozen through the standard freeze authority."
          : "An active freeze authority can freeze token accounts under standard token program rules.",
      source: "getParsedAccountInfo.parsed.info.freezeAuthority",
    },
  ];

  const token2022Extensions: Token2022ExtensionAuthority[] =
    input.tokenProgram === "token-2022"
      ? TOKEN_2022_EXTENSION_INVENTORY.map((extensionName) => {
          const parsedExtension = input.extensions?.find(
            (extension) => extension.extension === extensionName,
          );
          const config = TOKEN_2022_AUTHORITY_EXTENSION_FIELDS[extensionName];
          const observedFields =
            parsedExtension?.state == null
              ? []
              : config.fields
                  .map((field) => ({
                    field,
                    value: displayValue(parsedExtension.state?.[field]),
                  }))
                  .filter((field): field is { field: string; value: string } => field.value !== null);

          return {
            extension: extensionName,
            label: config.label,
            status: parsedExtension ? ("detected" as const) : ("not-parsed-m2" as const),
            authorityFields: observedFields,
            explanation: config.explanation,
            source: parsedExtension
              ? "getParsedAccountInfo.parsed.info.extensions"
              : "Token-2022 extension inventory, not parsed by M2",
          };
        })
      : [];

  const limitations = [
    "M2 evaluates standard mint authority and freeze authority for SPL Token and Token-2022 mints.",
  ];

  if (input.tokenProgram === "token-2022") {
    limitations.push(
      "Token-2022 can expose additional authority/control surfaces through extensions. M2 detects parsed extension names and selected parsed authority fields when RPC provides them, but it does not claim comprehensive Token-2022 authority coverage.",
    );
  }

  return {
    scope:
      input.tokenProgram === "unknown"
        ? "unsupported"
        : input.tokenProgram === "token-2022"
          ? "token-2022"
          : "legacy-spl-token",
    summary:
      input.tokenProgram === "token-2022"
        ? "Standard authorities were inspected. Token-2022 extension authority surfaces require explicit review and are not treated as safe by omission."
        : "Standard SPL Token mint and freeze authorities were inspected.",
    standardAuthorities,
    token2022Extensions,
    limitations,
  };
}

export function buildAuthoritySignals(mint: MintInspection): ObservableSignal[] {
  const signals = standardAuthoritySignals(mint);

  if (mint.tokenProgram === "token-2022") {
    signals.push({
      id: "token-2022-extension-authority-review-required",
      label: "Token-2022 extension authority review required",
      severity: "caution",
      condition: "The mint is owned by the Token-2022 program.",
      whyItMatters:
        "Revoked standard mint and freeze authorities do not prove low authority risk for Token-2022 tokens because extensions can add separate authority or control surfaces.",
      source: "account.owner",
    });
  }

  return signals;
}
