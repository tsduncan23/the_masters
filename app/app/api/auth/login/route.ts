import { createHash } from 'crypto'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  const password: string = body?.password ?? ''

  const expected = process.env.POOL_PASSWORD
  if (!expected || password !== expected) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = createHash('sha256').update(expected).digest('hex')
  const cookieStore = await cookies()
  cookieStore.set('masters-auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return Response.json({ success: true })
}
