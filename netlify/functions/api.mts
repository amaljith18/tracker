import type { Config } from '@netlify/functions'
import { randomBytes } from 'node:crypto'
import { eq, inArray, asc, desc, count } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { links, locations } from '../../db/schema.js'

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default async (req: Request) => {
  const url = new URL(req.url)
  const route = url.pathname
  if (!['/api/link', '/api/links', '/api/location'].includes(route)) {
    return json({ error: 'Not found.' }, 404)
  }
  if (!(route === '/api/link' ? req.method === 'POST' : route === '/api/links' ? req.method === 'GET' : ['GET', 'POST'].includes(req.method))) {
    return json({ error: 'Method not allowed.' }, 405)
  }
  let body: Record<string, unknown> = {}
  if (req.method === 'POST') {
    try {
      const value = await req.json()
      if (!value || typeof value !== 'object' || Array.isArray(value)) return json({ error: 'Invalid request body.' }, 400)
      body = value
    } catch {
      return json({ error: 'Invalid JSON.' }, 400)
    }
  }
  try {
    const db = getDb()
    if (route === '/api/link') {
      const id = randomBytes(16).toString('hex')
      const label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : ''
      await db.insert(links).values({ id, label, createdAt: Date.now() })
      return json({ id })
    }
    if (route === '/api/links') {
      const ids = (url.searchParams.get('ids') || '').split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length > 200) return json({ error: 'Too many links requested.' }, 400)
      if (!ids.length) return json({ links: [] })
      const saved = await db.select().from(links).where(inArray(links.id, ids))
      const summaries = await Promise.all(saved.map(async (link) => {
        const [latest] = await db.select({ lat: locations.lat, lng: locations.lng, accuracy: locations.accuracy, at: locations.at }).from(locations).where(eq(locations.linkId, link.id)).orderBy(desc(locations.sequence)).limit(1)
        const [total] = await db.select({ pings: count() }).from(locations).where(eq(locations.linkId, link.id))
        return { ...link, exists: true, pings: total.pings, latest: latest || null }
      }))
      return json({ links: ids.map(id => summaries.find(link => link.id === id) || { id, exists: false }) })
    }
    const id = req.method === 'POST' ? body.id : url.searchParams.get('id')
    if (typeof id !== 'string' || !id) return json({ error: 'Invalid link ID.' }, 400)
    if (req.method === 'POST') {
      const { lat, lng, accuracy } = body
      if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
        return json({ error: 'Invalid location data.' }, 400)
      }
      const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1)
      if (!link) return json({ error: 'Link not found.' }, 404)
      await db.insert(locations).values({ linkId: id, lat, lng, accuracy: typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null, at: Date.now() })
      return json({ ok: true })
    }
    const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1)
    if (!link) return json({ error: 'Link not found.' }, 404)
    const points = await db.select({ lat: locations.lat, lng: locations.lng, accuracy: locations.accuracy, at: locations.at }).from(locations).where(eq(locations.linkId, id)).orderBy(asc(locations.sequence))
    return json({ label: link.label, locations: points })
  } catch {
    return json({ error: 'The service is temporarily unavailable. Please try again.' }, 503)
  }
}

export const config: Config = { path: '/api/*' }
