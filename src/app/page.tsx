"use client"

import { useEffect, useState } from "react"
import { RiskMap } from "@/components/map/RiskMap"
import { fetchConflictData, type ConflictEvent } from "@/lib/gdelt"
import { RefreshCw, AlertTriangle, Clock, MapPin, ExternalLink } from "lucide-react"

export default function Home() {
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20])
  const [mapZoom, setMapZoom] = useState(1)
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const data = await fetchConflictData()
    setConflicts(data)
    setLoading(false)
    setLastUpdated(new Date())
  }

  useEffect(() => {
    loadData()
    // Poll every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Format time for display
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Get severity badge
  const getSeverityBadge = (goldstein: number) => {
    if (goldstein <= -5) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/30 text-red-400 uppercase">Severe</span>
    } else if (goldstein <= -2) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/30 text-orange-400 uppercase">Conflict</span>
    } else if (goldstein < 0) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/30 text-yellow-400 uppercase">Tension</span>
    }
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-500/30 text-gray-400 uppercase">Event</span>
  }

  // Handle click on conflict in sidebar
  const handleConflictClick = (conflict: ConflictEvent) => {
    setMapCenter([conflict.lon, conflict.lat])
    setMapZoom(4) // Zoom in to show the conflict
    setSelectedConflictId(conflict.id)

    // Reset selection after a delay
    setTimeout(() => {
      setSelectedConflictId(null)
    }, 3000)
  }

  return (
    <main className="flex h-screen w-full bg-background text-foreground flex-col md:flex-row overflow-hidden">
      {/* Sidebar / HUD */}
      <aside className="w-full md:w-96 bg-card border-r border-border flex flex-col z-20 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-red-950/30 to-transparent">
          <h1 className="text-2xl font-black tracking-tighter text-red-500 flex items-center gap-2">
            RISIKO <span className="text-white">IRL</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time Global Conflict Monitor
          </p>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-3 border-b border-border bg-black/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{conflicts.length}</div>
              <div className="text-[9px] text-gray-500 uppercase">Events</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">
                {conflicts.filter(c => c.goldstein <= -5).length}
              </div>
              <div className="text-[9px] text-gray-500 uppercase">Severe</div>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 group-hover:text-white ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Last Updated */}
        <div className="px-4 py-2 border-b border-border bg-black/20 flex items-center gap-2 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Last update: {lastUpdated.toLocaleTimeString('it-IT')}</span>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 text-xs text-muted-foreground border-b border-border bg-black/20 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="uppercase tracking-wider font-medium">Live Conflict Feed</span>
          </div>

          {loading && conflicts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="animate-pulse text-2xl mb-2">📡</div>
              <div className="text-sm">Connecting to satellite uplink...</div>
            </div>
          ) : conflicts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-2xl mb-2">🕊️</div>
              <div className="text-sm">No active conflicts detected</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...conflicts]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((c, i) => (
                  <div
                    key={c.id || i}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer group ${selectedConflictId === c.id ? 'bg-red-500/20 border-l-2 border-red-500' : ''
                      }`}
                    onClick={() => handleConflictClick(c)}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-bold text-white text-sm truncate max-w-[180px]">
                          {c.actor2Name || "Unknown Location"}
                        </span>
                      </div>
                      {getSeverityBadge(c.goldstein)}
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-1.5 text-[11px]">
                      {/* Attacker */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-red-400">⚔️</span>
                        <span className="text-gray-500">Aggressor:</span>
                        <span className="text-white font-medium truncate">
                          {c.actor1Name || "Unknown Force"}
                        </span>
                      </div>

                      {/* Location Coordinates */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span className="text-gray-500">Coords:</span>
                        <span className="font-mono text-gray-300">
                          {c.lat.toFixed(2)}°, {c.lon.toFixed(2)}°
                        </span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-3 h-3 text-green-400" />
                        <span className="text-gray-500">Reported:</span>
                        <span className="text-gray-300">
                          {formatEventTime(c.date)}
                        </span>
                      </div>
                    </div>

                    {/* Source Link */}
                    {c.sourceUrl && (
                      <a
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Read full report</span>
                      </a>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>System Online</span>
            <span className="mx-2 text-gray-700">|</span>
            <span className="text-gray-600">Data: GDELT Project</span>
            <span className="ml-auto text-gray-700">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Map Area */}
      <section className="flex-1 relative bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black pointer-events-none z-0" />
        <RiskMap
          conflicts={conflicts}
          center={mapCenter}
          zoom={mapZoom}
          selectedConflictId={selectedConflictId}
        />

        {/* Bottom Right Overlay */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-white/50 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            UPLINK: ACTIVE
          </div>
        </div>
      </section>
    </main>
  )
}
