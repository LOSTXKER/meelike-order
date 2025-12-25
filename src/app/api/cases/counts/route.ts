import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CaseService } from "@/services/case.service";
import { asyncErrorHandler, assertAuthenticated } from "@/lib/error-handler";

// GET /api/cases/counts - Get case counts by category
export const GET = asyncErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user);

  // Get counts using service
  const counts = await CaseService.getCaseCounts();

  return NextResponse.json(counts);
});
