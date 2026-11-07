import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const app = express()
const PORT = Number(process.env.PORT || 3002)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const links = new Map()

app.use(express.json())

function makeId() {
  return crypto.randomBytes(6).toString('hex')
}

app.post('/api/link', (req, res) => {
  const label = typeof req.body?.label === 'string' ? req.body.label.trim().slice(0, 80) : ''
  const id = makeId()
  links.set(id, { id, label, createdAt: Date.now(), locations: [] })
  res.json({ id })
})

app.get('/api/links', (req, res) => {
  const ids = String(req.query.ids || '').split(',').map((s) => s.trim()).filter(Boolean)
  const result = ids.map((id) => {
    const link = links.get(id)
    if (!link) return { id, exists: false }
    const latest = link.locations.at(-1) || null
    return {
      id,
      exists: true,
      label: link.label,
      createdAt: link.createdAt,
      pings: link.locations.length,
      latest,
    }
  })
  res.json({ links: result })
})

app.post('/api/location', (req, res) => {
  const { id, lat, lng, accuracy } = req.body || {}
  if (
    typeof id !== 'string' ||
    typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    return res.status(400).json({ error: 'Invalid location data.' })
  }

  const link = links.get(id)
  if (!link) return res.status(404).json({ error: 'Link not found.' })

  // Store a single, visitor-initiated location submission for this link.
  link.locations.push({
    lat,
    lng,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    at: Date.now(),
  })
  res.json({ ok: true })
})

app.get('/api/location', (req, res) => {
  const id = String(req.query.id || '')
  const link = links.get(id)
  if (!link) return res.status(404).json({ error: 'Link not found.' })
  res.json({ label: link.label, locations: link.locations })
})

const dist = path.resolve(__dirname, '../dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})