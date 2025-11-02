import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");

  // Redirect signup_disabled errors to access-denied page
  if (error === "signup_disabled") {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  // For other errors, you can customize the handling or show a generic error page
  return NextResponse.redirect(new URL("/login", request.url));
}
