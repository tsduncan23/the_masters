import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API without a valid session
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('masters-auth')?.value
  const expected = process.env.POOL_PASSWORD

  if (!expected || !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const expectedToken = createHash('sha256').update(expected).digest('hex')
  if (token !== expectedToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
