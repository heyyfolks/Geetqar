import { NextResponse } from 'next/server'
import { adminOnly } from '@/lib/admin-auth'
import { buildEntriesFresh } from '@/lib/catalog'
import { revalidateSite } from '@/lib/admin-apply'

export const dynamic = 'force-dynamic'

/** "Sync now": reads YouTube again, saves the result as the backup copy, and refreshes the public site. */
export async function POST(request: Request) {
  const auth = await adminOnly(request, { write: true })
  if ('error' in auth) return auth.error
  const { entries, sync } = await buildEntriesFresh()
  revalidateSite()
  return NextResponse.json({ ok: true, sync, total: entries.length })
}
