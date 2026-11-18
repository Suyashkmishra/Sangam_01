import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenFromQuery = searchParams.get("secret");
    const tokenFromHeader = request.headers.get("x-revalidate-token") || request.headers.get("x-revalidate-secret");
    const authHeader = request.headers.get("authorization");
    const tokenFromBearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const providedToken = tokenFromQuery || tokenFromHeader || tokenFromBearer;
    const expectedSecret =
      process.env.REVALIDATION_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "sangam_revalidate_secret_2026";

    if (!providedToken || providedToken !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing revalidation secret token" },
        { status: 401 }
      );
    }

    // Revalidate public explore feed, landing page poetry strip, and profile works
    revalidatePath("/", "page");
    revalidatePath("/explore", "page");
    revalidatePath("/profile", "page");

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
      message: "Paths revalidated successfully",
    });
  } catch (err: any) {
    console.error("Revalidation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to revalidate" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
