import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeMintAddress } from "@/lib/intel/mintAnalysis";
import { analysisResultSchema } from "@/lib/intel/schemas";

const requestSchema = z.object({
  mintAddress: z.string().trim().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Expected JSON body with mintAddress." },
      { status: 400 },
    );
  }

  const result = await analyzeMintAddress(parsed.data.mintAddress);
  const validated = analysisResultSchema.parse(result);

  return NextResponse.json(validated);
}
