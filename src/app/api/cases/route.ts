import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { CaseService } from "@/services/case.service";
import { CreateCaseSchema, CaseFiltersSchema } from "@/lib/validations";
import { canCreateCase } from "@/lib/auth-helpers";
import { 
  asyncErrorHandler, 
  assertAuthenticated, 
  assertAuthorized,
  successResponse 
} from "@/lib/error-handler";

// GET /api/cases - List all cases with filters
export const GET = asyncErrorHandler(async (request: NextRequest) => {
  // Rate limit check
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.READ);
  if (rateLimitResponse) return rateLimitResponse;

  // Auth check
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user);

  const searchParams = request.nextUrl.searchParams;
  const rawFilters = Object.fromEntries(searchParams.entries());

  // Validate query parameters
  const validatedFilters = CaseFiltersSchema.parse(rawFilters);

  // TECHNICIAN can only see own cases
  const filters: any = {
    status: validatedFilters.status,
    severity: validatedFilters.severity,
    category: validatedFilters.category,
    caseTypeId: validatedFilters.caseType,
    search: validatedFilters.search,
  };

  if (session!.user.role === "TECHNICIAN") {
    filters.ownerId = session!.user.id;
  }

  // Fetch cases using service
  const result = await CaseService.getCases(
    filters,
    validatedFilters.page || 1,
    validatedFilters.limit || 20,
    validatedFilters.sort || "createdAt-desc"
  );

  return NextResponse.json(result);
});

// POST /api/cases - Create a new case
export const POST = asyncErrorHandler(async (request: NextRequest) => {
  // Rate limit check
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.API);
  if (rateLimitResponse) return rateLimitResponse;

  // Auth check
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user);

  // Permission check: CEO, MANAGER, SUPPORT can create cases (TECHNICIAN cannot)
  assertAuthorized(
    canCreateCase(session),
    "TECHNICIAN cannot create cases"
  );

  const body = await request.json();

  // Validate input
  const validatedData = CreateCaseSchema.parse(body);

  // Create case using service
  const newCase = await CaseService.createCase(validatedData, session!.user.id);

  return NextResponse.json(newCase, { status: 201 });
});
