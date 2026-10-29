import { NextResponse } from 'next/server'
import { adminOnly } from '@/lib/admin-auth'
import { applyChanges, type Change } from '@/lib/admin-apply'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await adminOnly(request, { write: true })
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => null)
  const changes = Array.isArray(body?.changes) ? (body.changes as Change[]) : []
  if (!changes.length) return NextResponse.json({ error: 'No changes sent.' }, { status: 400 })
  const results = await applyChanges(auth.db, changes, body?.source === 'ai' ? 'ai' : 'manual')
  return NextResponse.json({ ok: results.every((r) => r.ok), results })
}
