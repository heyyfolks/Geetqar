'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { EFFECTS, DEFAULT_MOODS, type MoodDef } from '@/lib/moods'
import { KINDS, KIND_LABEL } from '@/lib/overrides'
import { slugKey, type SiteConfig, type ConfigKey } from '@/lib/site-config'
import type { Change } from '@/lib/admin-apply'

type Song = {
  id: string; slug: string; origin: 'youtube' | 'saved' | 'manual'; hidden: boolean; isNew: boolean
  name: string; kind: string; moods: string[]; published: string; views?: number; pinned: boolean; sort_order: number | null
  description: string; lyrics: string; credits: string; links: { spotify?: string; apple?: string; other?: string }; art_style: number | null
  edited: string[]; auto: { name: string; kind: string; moods: string[]; published: string; lyricsCount: number; description: string }
}
type Sync = { source: string; liveCount: number; savedCount: number; manualCount: number; hasApiKey: boolean; feed: string[]; at: string }
type LogRow = { id: number; at: string; source: string; summary: string }
type Control = { sync: Sync; config: SiteConfig; log: LogRow[]; ai: boolean; songs: Song[] }
type Preview = { reply: string; changes: Change[] }

const TABS = ['Songs', 'Moods', 'Content', 'Links & SEO', 'History'] as const
const FILTERS = ['All', 'Visible', 'Hidden', 'Originals', 'Covers', 'Needs review', 'No lyrics'] as const
const EXAMPLES = [
  'Make Ang Laga De a Cover and remove the Devotional mood',
  'Hide every song that has no lyrics',
  'Change the hero tagline to something shorter and punchier',
  'Pin Stolen from the Dream to the top',
]

async function api<T = any>(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const r = await fetch(path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = await r.json().catch(() => ({}))
    if (r.status === 401) location.href = '/admin/login'
    return { ok: r.ok, status: r.status, data }
  } catch { return { ok: false, status: 0, data: { error: 'Network error. Check your connection.' } as any } }
}

export default function Admin() {
  const [data, setData] = useState<Control | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Songs')
  const [toast, setToast] = useState<{ text: string; err?: boolean } | null>(null)
  const [loadErr, setLoadErr] = useState('')

  const say = useCallback((text: string, err = false) => { setToast({ text, err }); setTimeout(() => setToast(null), 3500) }, [])
  const load = useCallback(async () => {
    const r = await api<Control>('/api/admin/control')
    if (r.ok) { setData(r.data); setLoadErr('') } else setLoadErr((r.data as any)?.error || 'Could not load.')
  }, [])
  useEffect(() => { load() }, [load])

  const apply = useCallback(async (changes: Change[], source: 'manual' | 'ai' = 'manual') => {
    const r = await api<{ ok: boolean; results: { ok: boolean; summary: string; error?: string }[]; error?: string }>('/api/admin/apply', { changes, source })
    const failed = r.data.results?.filter((x) => !x.ok) || []
    if (!r.ok && !r.data.results) say(r.data.error || 'Save failed', true)
    else if (failed.length) say(`${failed.length} change(s) failed: ${failed[0].error || failed[0].summary}`, true)
    else say('Saved. The website is updated.')
    await load()
    return !failed.length && r.ok
  }, [load, say])

  if (!data) return <div className="ad-wrap"><p className="ad-muted">{loadErr || 'Loading…'}</p>{loadErr && <button className="ad-btn" onClick={load}>Retry</button>}</div>

  return (
    <div className="ad-wrap">
      <div className="ad-top">
        <h1>Geetqar control room</h1>
        <div className="ad-row"><a href="/" target="_blank" rel="noreferrer">View site ↗</a><button className="ad-btn ghost sm" onClick={async () => { const { createSupabaseBrowserClient } = await import('@/lib/supabase-browser'); await createSupabaseBrowserClient().auth.signOut(); location.href = '/admin/login' }}>Sign out</button></div>
      </div>
      <AiBox enabled={data.ai} apply={apply} say={say} />
      <div className="ad-tabs" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className="ad-tab" onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'Songs' && <SongsTab data={data} apply={apply} say={say} reload={load} />}
      {tab === 'Moods' && <MoodsTab config={data.config} apply={apply} />}
      {tab === 'Content' && <ContentTab config={data.config} apply={apply} />}
      {tab === 'Links & SEO' && <LinksTab config={data.config} apply={apply} />}
      {tab === 'History' && <HistoryTab log={data.log} reload={load} say={say} />}
      {toast && <div className={`ad-toast${toast.err ? ' err' : ''}`} role="status">{toast.text}</div>}
    </div>
  )
}

type Apply = (c: Change[], s?: 'manual' | 'ai') => Promise<boolean>

/* ---------------- AI ---------------- */
function AiBox({ enabled, apply, say }: { enabled: boolean; apply: Apply; say: (t: string, e?: boolean) => void }) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [prev, setPrev] = useState<Preview | null>(null)
  const [note, setNote] = useState('')

  async function run() {
    if (!prompt.trim() || busy) return
    setBusy(true); setPrev(null); setNote('')
    const r = await api<any>('/api/admin/ai', { prompt })
    setBusy(false)
    if (r.status === 501) { setNote(r.data.message); return }
    if (!r.ok) { setNote(r.data.error || 'Something went wrong.'); return }
    setPrev(r.data)
  }
  async function confirm() {
    if (!prev?.changes.length) return
    if (await apply(prev.changes, 'ai')) { setPrev(null); setPrompt('') }
  }
  const describe = (c: Change) => c.target === 'config' ? `Settings → ${c.key}` : `${c.label || c.id} → ${c.target === 'track_reset' ? 'reset to automatic' : Object.keys((c as any).set || {}).join(', ')}`

  return (
    <div className="ad-ai">
      <label className="ad-lab" htmlFor="ai-prompt" style={{ marginTop: 0 }}>Ask the assistant to change anything</label>
      <textarea id="ai-prompt" className="ad-ta" style={{ minHeight: 56 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Make Ang Laga De a Cover and remove Devotional" disabled={!enabled} />
      <div className="ad-row" style={{ marginTop: 8 }}>
        <button className="ad-btn" onClick={run} disabled={!enabled || busy || !prompt.trim()}>{busy ? 'Thinking…' : 'Preview changes'}</button>
        {EXAMPLES.map((e) => <button key={e} className="ad-chip" onClick={() => setPrompt(e)} disabled={!enabled}>{e}</button>)}
      </div>
      {!enabled && <p className="ad-muted" style={{ marginTop: 8 }}>The AI box is off. Add <b>ANTHROPIC_API_KEY</b> in Vercel → Settings → Environment Variables, then redeploy. Everything else here works without it.</p>}
      {note && <p className="ad-bad" style={{ marginTop: 8 }}>{note}</p>}
      {prev && (
        <div className="ad-prev">
          <p>{prev.reply}</p>
          {prev.changes.length ? <ul>{prev.changes.map((c, i) => <li key={i}>{describe(c)}</li>)}</ul> : <p className="ad-muted">No changes proposed.</p>}
          <div className="ad-row"><button className="ad-btn" disabled={!prev.changes.length} onClick={confirm}>Apply {prev.changes.length} change{prev.changes.length === 1 ? '' : 's'}</button><button className="ad-btn ghost" onClick={() => setPrev(null)}>Discard</button></div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Songs ---------------- */
function SongsTab({ data, apply, say, reload }: { data: Control; apply: Apply; say: (t: string, e?: boolean) => void; reload: () => Promise<void> }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [open, setOpen] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [needTitle, setNeedTitle] = useState(false)
  const [busy, setBusy] = useState('')
  const moods = data.config.moods

  const list = useMemo(() => data.songs.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false
    switch (filter) {
      case 'Visible': return !s.hidden
      case 'Hidden': return s.hidden
      case 'Originals': return s.kind === 'Single' || s.kind === 'Official Audio' || s.kind === 'Music Video' || s.kind === 'Lyric Video'
      case 'Covers': return s.kind === 'Cover' || s.kind === 'Mashup'
      case 'Needs review': return s.isNew || (!s.edited.length && s.origin !== 'manual')
      case 'No lyrics': return !s.lyrics
      default: return true
    }
  }), [data.songs, q, filter])

  async function sync() { setBusy('sync'); const r = await api('/api/admin/sync', {}); setBusy(''); say(r.ok ? 'Synced from YouTube.' : 'Sync failed.', !r.ok); await reload() }
  async function add() {
    setBusy('add')
    const r = await api<any>('/api/admin/add-video', { url, title: title || undefined })
    setBusy('')
    if (r.ok) { say(`Added “${r.data.title}”.`); setUrl(''); setTitle(''); setNeedTitle(false); await reload() }
    else { setNeedTitle(Boolean(r.data.needTitle)); say(r.data.error || 'Could not add.', true) }
  }
  const s = data.sync

  return (
    <>
      <div className={`ad-card${s.hasApiKey ? '' : ' ad-warn'}`}>
        <h2>YouTube sync</h2>
        <div className="ad-row" style={{ gap: 20 }}>
          <div><div className="ad-stat">{data.songs.length}</div><div className="ad-muted">songs</div></div>
          <div><div className="ad-stat">{s.liveCount}</div><div className="ad-muted">live from YouTube</div></div>
          <div><div className="ad-stat">{s.savedCount}</div><div className="ad-muted">saved copies</div></div>
          <div><div className="ad-stat">{s.manualCount}</div><div className="ad-muted">added by hand</div></div>
        </div>
        <p className="ad-muted">Source: {s.source}. {s.at && `Last read ${new Date(s.at).toLocaleString()}.`}</p>
        {!s.hasApiKey && <p>For the full channel, dates, views and descriptions, add <b>YOUTUBE_API_KEY</b> in Vercel (Google Cloud → YouTube Data API v3 → API key), then redeploy. Missing songs can always be added below by link.</p>}
        <div className="ad-row"><button className="ad-btn" onClick={sync} disabled={busy === 'sync'}>{busy === 'sync' ? 'Syncing…' : 'Sync now'}</button></div>
        <label className="ad-lab">Add a video by YouTube link</label>
        <div className="ad-row">
          <input className="ad-in" style={{ flex: '1 1 260px' }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" />
          {needTitle && <input className="ad-in" style={{ flex: '1 1 200px' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" />}
          <button className="ad-btn" onClick={add} disabled={!url.trim() || busy === 'add'}>Add</button>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-row">
          <input className="ad-in" style={{ flex: '1 1 200px' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs" />
        </div>
        <div className="ad-row" style={{ marginTop: 8 }}>{FILTERS.map((f) => <button key={f} className={`ad-chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}</div>
        <p className="ad-muted">{list.length} shown. “Original” = your own song; “Cover” and “Mashup” are labelled that way on the site.</p>
      </div>

      {list.map((song) => <SongCard key={song.id} song={song} moods={moods} open={open === song.id} toggle={() => setOpen(open === song.id ? null : song.id)} apply={apply} />)}
      {!list.length && <p className="ad-muted">Nothing matches.</p>}
    </>
  )
}

function SongCard({ song, moods, open, toggle, apply }: { song: Song; moods: MoodDef[]; open: boolean; toggle: () => void; apply: Apply }) {
  const set = (patch: Record<string, unknown>) => apply([{ target: 'track', id: song.id, set: patch, label: song.name }])
  const toggleMood = (k: string) => set({ moods: song.moods.includes(k) ? song.moods.filter((m) => m !== k) : [...song.moods, k] })
  return (
    <div className={`ad-card ad-song${song.hidden ? ' is-hidden' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ad-thumb" src={`https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`} alt="" loading="lazy" />
      <div>
        <div className="ad-row" style={{ justifyContent: 'space-between' }}>
          <b>{song.name}</b>
          <div className="ad-row">
            {song.isNew && <span className="ad-chip new">NEW</span>}
            {song.hidden && <span className="ad-chip hid">Hidden</span>}
            {song.pinned && <span className="ad-chip on">Pinned</span>}
            <span className="ad-chip">{song.origin === 'manual' ? 'Added by hand' : song.origin === 'saved' ? 'Saved copy' : song.edited.length ? 'Edited' : 'Auto'}</span>
          </div>
        </div>
        <div className="ad-row" style={{ margin: '8px 0' }}>
          <select className="ad-sel" style={{ width: 'auto' }} value={song.kind} onChange={(e) => set({ kind: e.target.value })} aria-label="Type">{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          <button className="ad-btn ghost sm" onClick={() => set({ hidden: !song.hidden })}>{song.hidden ? 'Show' : 'Hide'}</button>
          <button className="ad-btn ghost sm" onClick={() => set({ pinned: !song.pinned })}>{song.pinned ? 'Unpin' : 'Pin to top'}</button>
          <button className="ad-btn sm" onClick={toggle}>{open ? 'Close' : 'Edit all'}</button>
        </div>
        <div className="ad-row">{moods.map((m) => <button key={m.key} className={`ad-chip${song.moods.includes(m.key) ? ' on' : ''}`} onClick={() => toggleMood(m.key)}>{m.label}</button>)}</div>
        {open && <SongEditor song={song} apply={apply} />}
      </div>
    </div>
  )
}

function SongEditor({ song, apply }: { song: Song; apply: Apply }) {
  const [d, setD] = useState({ name: song.name, lyrics: song.lyrics, description: song.description || '', credits: song.credits, published: (song.published || '').slice(0, 10), spotify: song.links.spotify || '', apple: song.links.apple || '', other: song.links.other || '', art: song.art_style === null ? '' : String(song.art_style), order: song.sort_order === null ? '' : String(song.sort_order) })
  const lines = d.lyrics.split(/\r?\n/).filter((l) => l.trim()).length
  const save = () => apply([{ target: 'track', id: song.id, label: song.name, set: {
    name: d.name.trim() && d.name.trim() !== song.auto.name ? d.name.trim() : null,
    lyrics: d.lyrics.trim() || null,
    description: d.description.trim() && d.description.trim() !== song.auto.description ? d.description.trim() : null,
    credits: d.credits.trim() || null,
    published: d.published || null,
    links: { spotify: d.spotify.trim(), apple: d.apple.trim(), other: d.other.trim() },
    art_style: d.art === '' ? null : Number(d.art),
    sort_order: d.order === '' ? null : Number(d.order),
  } }])
  const f = (k: keyof typeof d) => ({ value: d[k], onChange: (e: React.ChangeEvent<any>) => setD({ ...d, [k]: e.target.value }) })
  return (
    <div className="ad-sec">
      <label className="ad-lab">Song name</label><input className="ad-in" {...f('name')} />
      <label className="ad-lab">Lyrics ({lines} lines): used for the lyric cards and the song page. One line per row.</label><textarea className="ad-ta" style={{ minHeight: 200 }} {...f('lyrics')} />
      <label className="ad-lab">Description</label><textarea className="ad-ta" {...f('description')} />
      <div className="ad-grid">
        <div><label className="ad-lab">Credits</label><input className="ad-in" {...f('credits')} placeholder="Written, produced and mixed by geetqar" /></div>
        <div><label className="ad-lab">Release date</label><input className="ad-in" type="date" {...f('published')} /></div>
        <div><label className="ad-lab">Order number (lower = earlier)</label><input className="ad-in" type="number" min={0} max={9999} {...f('order')} /></div>
        <div><label className="ad-lab">Cover art style</label><select className="ad-sel" {...f('art')}><option value="">Auto</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Style {i + 1}</option>)}</select></div>
      </div>
      <div className="ad-grid">
        <div><label className="ad-lab">Spotify link</label><input className="ad-in" {...f('spotify')} placeholder="https://…" /></div>
        <div><label className="ad-lab">Apple Music link</label><input className="ad-in" {...f('apple')} placeholder="https://…" /></div>
        <div><label className="ad-lab">Other link</label><input className="ad-in" {...f('other')} placeholder="https://…" /></div>
      </div>
      <div className="ad-row" style={{ marginTop: 12 }}>
        <button className="ad-btn" onClick={save}>Save song</button>
        <button className="ad-btn ghost" onClick={() => apply([{ target: 'track', id: song.id, label: song.name, set: { moods: null, kind: null } }])}>Reset type and moods to automatic</button>
        {song.origin !== 'manual' && <button className="ad-btn ghost" onClick={() => confirm('Reset everything for this song to automatic?') && apply([{ target: 'track_reset', id: song.id, label: song.name }])}>Reset all</button>}
        {song.origin === 'manual' && <button className="ad-btn danger" onClick={() => confirm('Remove this song?') && apply([{ target: 'track_remove', id: song.id, label: song.name }])}>Remove song</button>}
      </div>
    </div>
  )
}

/* ---------------- Moods ---------------- */
function MoodsTab({ config, apply }: { config: SiteConfig; apply: Apply }) {
  const [list, setList] = useState<MoodDef[]>(config.moods)
  useEffect(() => setList(config.moods), [config.moods])
  const up = (i: number, p: Partial<MoodDef>) => setList(list.map((m, j) => (j === i ? { ...m, ...p } : m)))
  const move = (i: number, d: number) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setList(n) }
  const add = () => setList([...list, { key: `mood-${list.length + 1}`, label: 'New mood', line: 'A short line for this mood', c1: '#c8643c', c2: '#6a2a2a', effect: 'dust' }])
  const save = () => apply([{ target: 'config', key: 'moods', value: list.map((m) => ({ ...m, key: m.key.startsWith('mood-') ? slugKey(m.label) || m.key : m.key })), label: 'Moods' }])
  return (
    <>
      <div className="ad-card"><h2>Moods</h2><p className="ad-muted">Each mood changes the colours, particles and sound of the whole site for the visitor. Songs are tagged with moods on the Songs tab.</p></div>
      {list.map((m, i) => (
        <div className="ad-card" key={m.key + i}>
          <div className="ad-grid">
            <div><label className="ad-lab">Name</label><input className="ad-in" value={m.label} onChange={(e) => up(i, { label: e.target.value })} /></div>
            <div><label className="ad-lab">Line shown to visitors</label><input className="ad-in" value={m.line} onChange={(e) => up(i, { line: e.target.value })} /></div>
            <div><label className="ad-lab">Effect</label><select className="ad-sel" value={m.effect} onChange={(e) => up(i, { effect: e.target.value as MoodDef['effect'] })}>{EFFECTS.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className="ad-lab">Colours</label><div className="ad-row"><input type="color" className="ad-swatch" value={m.c1} onChange={(e) => up(i, { c1: e.target.value })} aria-label="Main colour" /><input type="color" className="ad-swatch" value={m.c2} onChange={(e) => up(i, { c2: e.target.value })} aria-label="Second colour" /></div></div>
          </div>
          <div className="ad-row" style={{ marginTop: 8 }}>
            <button className="ad-btn ghost sm" onClick={() => move(i, -1)}>↑</button><button className="ad-btn ghost sm" onClick={() => move(i, 1)}>↓</button>
            <button className="ad-btn danger sm" disabled={list.length <= 1} onClick={() => setList(list.filter((_, j) => j !== i))}>Remove</button>
          </div>
        </div>
      ))}
      <div className="ad-row"><button className="ad-btn ghost" onClick={add} disabled={list.length >= 12}>+ Add mood</button><button className="ad-btn" onClick={save}>Save moods</button><button className="ad-btn ghost" onClick={() => setList(DEFAULT_MOODS)}>Load defaults</button></div>
    </>
  )
}

/* ---------------- Content ---------------- */
function useDraft<K extends ConfigKey>(config: SiteConfig, key: K) {
  const [v, setV] = useState<SiteConfig[K]>(config[key])
  useEffect(() => setV(config[key]), [config, key])
  return [v, setV] as const
}
const lines = (s: string) => s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)

function ContentTab({ config, apply }: { config: SiteConfig; apply: Apply }) {
  const [hero, setHero] = useDraft(config, 'hero')
  const [sections, setSections] = useDraft(config, 'sections')
  const [craft, setCraft] = useDraft(config, 'craft')
  const [work, setWork] = useDraft(config, 'work')
  const [about, setAbout] = useDraft(config, 'about')
  const [ann, setAnn] = useDraft(config, 'announcement')
  const [drop, setDrop] = useDraft(config, 'drop')
  const [amb, setAmb] = useDraft(config, 'ambience')
  const save = (key: ConfigKey, value: unknown) => apply([{ target: 'config', key, value, label: key }])
  return (
    <>
      <div className="ad-card"><h2>Hero</h2>
        <label className="ad-lab">Roles (one per line)</label><textarea className="ad-ta" value={hero.roles.join('\n')} onChange={(e) => setHero({ ...hero, roles: lines(e.target.value) })} />
        <label className="ad-lab">Tagline</label><textarea className="ad-ta" value={hero.tagline} onChange={(e) => setHero({ ...hero, tagline: e.target.value })} />
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn" onClick={() => save('hero', hero)}>Save hero</button></div></div>

      <div className="ad-card"><h2>Announcement bar and next drop</h2>
        <label className="ad-row"><input type="checkbox" checked={ann.enabled} onChange={(e) => setAnn({ ...ann, enabled: e.target.checked })} /> Show announcement</label>
        <label className="ad-lab">Text</label><input className="ad-in" value={ann.text} onChange={(e) => setAnn({ ...ann, text: e.target.value })} />
        <label className="ad-lab">Link</label><input className="ad-in" value={ann.url} onChange={(e) => setAnn({ ...ann, url: e.target.value })} placeholder="https://…" />
        <div className="ad-row" style={{ margin: '10px 0' }}><button className="ad-btn" onClick={() => save('announcement', ann)}>Save announcement</button></div>
        <label className="ad-row"><input type="checkbox" checked={drop.enabled} onChange={(e) => setDrop({ ...drop, enabled: e.target.checked })} /> Show countdown to next release</label>
        <div className="ad-grid"><div><label className="ad-lab">Title</label><input className="ad-in" value={drop.title} onChange={(e) => setDrop({ ...drop, title: e.target.value })} /></div>
          <div><label className="ad-lab">Date and time</label><input className="ad-in" type="datetime-local" value={drop.date ? drop.date.slice(0, 16) : ''} onChange={(e) => setDrop({ ...drop, date: e.target.value })} /></div>
          <div><label className="ad-lab">Link</label><input className="ad-in" value={drop.url} onChange={(e) => setDrop({ ...drop, url: e.target.value })} placeholder="https://…" /></div></div>
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn" onClick={() => save('drop', drop)}>Save next drop</button></div></div>

      <div className="ad-card"><h2>Sections and ambience</h2>
        <div className="ad-grid">{(Object.keys(sections) as (keyof typeof sections)[]).map((k) => <label key={k} className="ad-row"><input type="checkbox" checked={sections[k]} onChange={(e) => setSections({ ...sections, [k]: e.target.checked })} /> {k}</label>)}</div>
        <div className="ad-row" style={{ margin: '10px 0' }}><button className="ad-btn" onClick={() => save('sections', sections)}>Save sections</button></div>
        <label className="ad-row"><input type="checkbox" checked={amb.enabled} onChange={(e) => setAmb({ enabled: e.target.checked })} /> Mood ambience on by default for visitors</label>
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn" onClick={() => save('ambience', amb)}>Save ambience</button></div></div>

      <div className="ad-card"><h2>Craft section</h2>
        <label className="ad-lab">Heading (use *word* for italic)</label><input className="ad-in" value={craft.heading} onChange={(e) => setCraft({ ...craft, heading: e.target.value })} />
        <label className="ad-lab">Intro</label><textarea className="ad-ta" value={craft.lede} onChange={(e) => setCraft({ ...craft, lede: e.target.value })} />
        {craft.items.map((it, i) => <div key={i} className="ad-card" style={{ marginTop: 8 }}>
          <input className="ad-in" value={it.title} onChange={(e) => setCraft({ ...craft, items: craft.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} aria-label="Title" />
          <textarea className="ad-ta" style={{ marginTop: 6 }} value={it.text} onChange={(e) => setCraft({ ...craft, items: craft.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} aria-label="Text" />
          <input className="ad-in" style={{ marginTop: 6 }} value={it.tags.join(', ')} onChange={(e) => setCraft({ ...craft, items: craft.items.map((x, j) => (j === i ? { ...x, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : x)) })} aria-label="Tags" placeholder="tags, separated, by commas" />
          <button className="ad-btn danger sm" style={{ marginTop: 6 }} onClick={() => setCraft({ ...craft, items: craft.items.filter((_, j) => j !== i) })}>Remove</button></div>)}
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn ghost" onClick={() => setCraft({ ...craft, items: [...craft.items, { title: 'New item', text: '', tags: [] }] })}>+ Add item</button><button className="ad-btn" onClick={() => save('craft', craft)}>Save craft</button></div></div>

      <div className="ad-card"><h2>Work with me</h2>
        <label className="ad-lab">Heading</label><input className="ad-in" value={work.heading} onChange={(e) => setWork({ ...work, heading: e.target.value })} />
        <label className="ad-lab">Intro</label><textarea className="ad-ta" value={work.lede} onChange={(e) => setWork({ ...work, lede: e.target.value })} />
        <label className="ad-lab">Button label</label><input className="ad-in" value={work.ctaLabel} onChange={(e) => setWork({ ...work, ctaLabel: e.target.value })} />
        {work.services.map((it, i) => <div key={i} className="ad-card" style={{ marginTop: 8 }}>
          <input className="ad-in" value={it.title} onChange={(e) => setWork({ ...work, services: work.services.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} aria-label="Service" />
          <textarea className="ad-ta" style={{ marginTop: 6 }} value={it.text} onChange={(e) => setWork({ ...work, services: work.services.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} aria-label="Description" />
          <button className="ad-btn danger sm" style={{ marginTop: 6 }} onClick={() => setWork({ ...work, services: work.services.filter((_, j) => j !== i) })}>Remove</button></div>)}
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn ghost" onClick={() => setWork({ ...work, services: [...work.services, { title: 'New service', text: '' }] })}>+ Add service</button><button className="ad-btn" onClick={() => save('work', work)}>Save work</button></div></div>

      <div className="ad-card"><h2>About page</h2>
        <label className="ad-lab">Intro</label><textarea className="ad-ta" style={{ minHeight: 140 }} value={about.intro} onChange={(e) => setAbout({ ...about, intro: e.target.value })} />
        {about.faq.map((it, i) => <div key={i} className="ad-card" style={{ marginTop: 8 }}>
          <input className="ad-in" value={it.q} onChange={(e) => setAbout({ ...about, faq: about.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} aria-label="Question" />
          <textarea className="ad-ta" style={{ marginTop: 6 }} value={it.a} onChange={(e) => setAbout({ ...about, faq: about.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} aria-label="Answer" />
          <button className="ad-btn danger sm" style={{ marginTop: 6 }} onClick={() => setAbout({ ...about, faq: about.faq.filter((_, j) => j !== i) })}>Remove</button></div>)}
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn ghost" onClick={() => setAbout({ ...about, faq: [...about.faq, { q: 'New question', a: '' }] })}>+ Add question</button><button className="ad-btn" onClick={() => save('about', about)}>Save about</button></div></div>
    </>
  )
}

/* ---------------- Links & SEO ---------------- */
function LinksTab({ config, apply }: { config: SiteConfig; apply: Apply }) {
  const [links, setLinks] = useDraft(config, 'links')
  const [seo, setSeo] = useDraft(config, 'seo')
  const L: [keyof typeof links, string][] = [['instagram', 'Instagram'], ['youtube', 'YouTube channel'], ['spotify', 'Spotify'], ['apple', 'Apple Music'], ['unitedmasters', 'UnitedMasters'], ['email', 'Contact email']]
  return (
    <>
      <div className="ad-card"><h2>Links</h2>
        <div className="ad-grid">{L.map(([k, label]) => <div key={k}><label className="ad-lab">{label}</label><input className="ad-in" value={links[k]} onChange={(e) => setLinks({ ...links, [k]: e.target.value })} /></div>)}</div>
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn" onClick={() => apply([{ target: 'config', key: 'links', value: links, label: 'Links' }])}>Save links</button></div></div>
      <div className="ad-card"><h2>Google search appearance</h2>
        <label className="ad-lab">Title ({seo.title.length}/60)</label><input className="ad-in" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
        <label className="ad-lab">Description ({seo.description.length}/160)</label><textarea className="ad-ta" value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
        <label className="ad-lab">Keywords (comma separated)</label><input className="ad-in" value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} />
        <div className="ad-row" style={{ marginTop: 10 }}><button className="ad-btn" onClick={() => apply([{ target: 'config', key: 'seo', value: seo, label: 'SEO' }])}>Save SEO</button></div>
        <p className="ad-muted">Google and Bing verification codes are set in Vercel as GOOGLE_SITE_VERIFICATION and BING_SITE_VERIFICATION.</p></div>
    </>
  )
}

/* ---------------- History ---------------- */
function HistoryTab({ log, reload, say }: { log: LogRow[]; reload: () => Promise<void>; say: (t: string, e?: boolean) => void }) {
  async function undo(id: number) {
    const r = await api<any>('/api/admin/undo', { id })
    say(r.ok ? r.data.summary : r.data.error || 'Could not undo', !r.ok)
    await reload()
  }
  return (
    <div className="ad-card"><h2>Recent changes</h2>
      {!log.length && <p className="ad-muted">Nothing yet.</p>}
      {log.map((l) => <div key={l.id} className="ad-row" style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2b2022' }}>
        <div><div>{l.summary}</div><div className="ad-muted">{new Date(l.at).toLocaleString()} · {l.source}</div></div>
        {l.source !== 'undo' && <button className="ad-btn ghost sm" onClick={() => undo(l.id)}>Undo</button>}
      </div>)}
    </div>
  )
}
