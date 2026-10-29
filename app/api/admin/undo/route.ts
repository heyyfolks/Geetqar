import { NextResponse } from 'next/server'
import { adminOnly } from '@/lib/admin-auth'
import { undoLog } from '@/lib/admin-apply'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await adminOnly(request, { write: true })
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => null)
  const id = Number(body?.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  const result = await undoLog(auth.db, id)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
