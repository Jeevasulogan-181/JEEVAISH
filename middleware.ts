import { NextResponse, type NextRequest } from "next/server"

// Minimal middleware — just passes requests through.
// Auth is fully local: access-token refresh is handled client-side in lib/api-client.ts.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
