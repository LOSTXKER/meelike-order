import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CaseService } from "@/services/case.service";
import { UpdateCaseSchema } from "@/lib/validations";
import { canModifyCase, canCloseCase } from "@/lib/auth-helpers";
import {
  asyncErrorHandler,
  assertAuthenticated,
  assertAuthorized,
  NotFoundError,
} from "@/lib/error-handler";

// GET /api/cases/[id] - Get case detail
export const GET = asyncErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Fetch case using service
  const caseDetail = await CaseService.getCaseById(id);

  return NextResponse.json(caseDetail);
});

// PATCH /api/cases/[id] - Update case
export const PATCH = asyncErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user);

  const { id } = await params;
  const body = await request.json();

  // Validate input
  const validatedData = UpdateCaseSchema.parse(body);

  // Permission check
  const currentCase = await CaseService.getCaseById(id);
  
  assertAuthorized(
    canModifyCase(session, currentCase.ownerId),
    "You can only modify your own cases"
  );

  // Check close permission
  if (validatedData.status === "CLOSED") {
    assertAuthorized(
      canCloseCase(session),
      "Only CEO, MANAGER, and SUPPORT can close cases"
    );
  }

  // Update case using service
  const updatedCase = await CaseService.updateCase(
    id,
    validatedData,
    session!.user.id
  );

  return NextResponse.json(updatedCase);
});

// DELETE /api/cases/[id] - Soft delete a case
export const DELETE = asyncErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user);

  // Only CEO and MANAGER can delete cases
  assertAuthorized(
    ["CEO", "MANAGER"].includes(session!.user.role),
    "Only CEO and MANAGER can delete cases"
  );

  const { id } = await params;

  // Delete case using service
  const deletedCase = await CaseService.deleteCase(id, session!.user.id);

  return NextResponse.json({
    success: true,
    message: "Case deleted successfully",
    caseNumber: deletedCase.caseNumber,
  });
});
