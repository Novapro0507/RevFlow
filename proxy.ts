import { NextResponse, type NextRequest } from 'next/server'

// Single-tenant / no-login mode: the app is an internal tool with no auth gate.
// The proxy is a pass-through; access control is handled at the network layer.
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
