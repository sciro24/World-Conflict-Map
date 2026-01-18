"use client"

import { useEffect, useState, useMemo } from "react"
import { RiskMap } from "@/components/map/RiskMap"
import { fetchConflictData, type ConflictEvent } from "@/lib/gdelt"
import { RefreshCw, AlertTriangle, Clock, MapPin, ExternalLink, Filter, SortAsc, Swords, Megaphone, Zap, Skull, ShieldAlert, Flame, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react"

// Event type configuration
const EVENT_TYPES = {
  conflict: { Icon: Swords, label: "Conflicts", color: "#ef4444" },
  civil_war: { Icon: Flame, label: "Civil War", color: "#dc2626" },
  protest: { Icon: Megaphone, label: "Protests", color: "#f59e0b" },
  cyber: { Icon: Zap, label: "Cyber Attacks", color: "#3b82f6" },
  terrorism: { Icon: Skull, label: "Terrorism", color: "#a855f7" },
} as const;

type EventType = keyof typeof EVENT_TYPES;
type SortType = "date" | "type";

export default function Home() {
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20])
  const [mapZoom, setMapZoom] = useState(1)
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortType>("date")
  const [filterType, setFilterType] = useState<EventType | "all">("all")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const data = await fetchConflictData()
    setConflicts(data)
    setLoading(false)
    setLastUpdated(new Date())
  }

  useEffect(() => {
    // Check screen size for sidebar
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }

    // Initial fetch
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Sorted and filtered events
  const displayedEvents = useMemo(() => {
    let filtered = [...conflicts];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(c => c.eventType === filterType);
    }

    // Sort
    if (sortBy === "date") {
      // Sort by START DATE (Newest started = Top, Longest running = Bottom)
      filtered.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : new Date(a.date).getTime();
        const dateB = b.startDate ? new Date(b.startDate).getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "type") {
      const typeOrder = ["conflict", "civil_war", "terrorism", "cyber", "protest"];
      filtered.sort((a, b) => typeOrder.indexOf(a.eventType) - typeOrder.indexOf(b.eventType));
    }

    return filtered;
  }, [conflicts, sortBy, filterType]);

  // Count by type
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = { all: conflicts.length };
    conflicts.forEach(c => {
      counts[c.eventType] = (counts[c.eventType] || 0) + 1;
    });
    return counts;
  }, [conflicts]);

  // Format date (only day, no time)
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Get event icon
  const getEventIcon = (type: string) => {
    return EVENT_TYPES[type as EventType]?.Icon || AlertTriangle;
  }

  // Handle click
  const handleConflictClick = (conflict: ConflictEvent) => {
    setMapCenter([conflict.lon, conflict.lat])
    setMapZoom(4)
    setSelectedConflictId(conflict.id)
    setTimeout(() => setSelectedConflictId(null), 3000)
  }

  return (
    <main className="flex h-screen w-full bg-background text-foreground flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      {/* Sidebar - Collapsible */}
      <aside
        className={`${isSidebarOpen ? 'w-full md:w-96 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 overflow-hidden'} bg-card border-r border-border flex flex-col z-20 shadow-xl transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-red-950/30 to-transparent">
          <h1 className="text-2xl font-black tracking-tighter text-red-500 flex items-center gap-2">
            RISIKO <span className="text-white">IRL</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time Global Event Monitor
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            Made by Diego Scirocco
          </p>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-3 border-b border-border bg-black/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(["conflict", "civil_war", "protest", "cyber", "terrorism"] as EventType[]).map(type => {
              const Icon = EVENT_TYPES[type].Icon;
              return (
                <div key={type} className="text-center flex flex-col items-center">
                  <div className="text-sm font-bold" style={{ color: EVENT_TYPES[type].color }}>
                    {eventCounts[type] || 0}
                  </div>
                  <Icon className="w-3 h-3 opacity-70" />
                </div>
              );
            })}
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

        {/* Sort & Filter Controls */}
        <div className="px-4 py-2 border-b border-border bg-black/20 flex items-center gap-2">
          {/* Sort Toggle */}
          <button
            onClick={() => setSortBy(sortBy === "date" ? "type" : "date")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded border border-white/10 text-gray-400"
          >
            <SortAsc className="w-3 h-3" />
            {sortBy === "date" ? "By Date" : "By Type"}
          </button>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2 py-1 text-[10px] rounded border ${filterType === "all" ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-gray-500"}`}
            >
              All
            </button>
            {(["conflict", "civil_war", "protest", "cyber", "terrorism"] as EventType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-1.5 py-1 text-[10px] rounded border ${filterType === type ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"}`}
                style={{ color: filterType === type ? EVENT_TYPES[type].color : "#6b7280" }}
              >
                {(() => {
                  const Icon = EVENT_TYPES[type].Icon;
                  return <Icon className="w-3 h-3" />;
                })()}
              </button>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="px-4 py-2 border-b border-border bg-black/10 flex items-center gap-2 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Last update: {lastUpdated ? lastUpdated.toLocaleTimeString('it-IT') : '...'}</span>
          <span className="ml-auto">{displayedEvents.length} events</span>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conflicts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="animate-pulse text-2xl mb-2">📡</div>
              <div className="text-sm">Connecting to satellite uplink...</div>
            </div>
          ) : displayedEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No events match current filters</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {displayedEvents.map((c, i) => (
                <div
                  key={c.id || i}
                  className={`p-4 mb-3 hover:bg-white/5 transition-all duration-200 cursor-pointer group rounded-xl border ${selectedConflictId === c.id
                    ? 'bg-red-950/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                    : 'bg-black/20 border-white/5 hover:border-white/10'
                    }`}
                  onClick={() => handleConflictClick(c)}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border border-white/10 ${selectedConflictId === c.id ? 'bg-red-500/20' : 'bg-white/5'}`}>
                        {(() => {
                          const Icon = getEventIcon(c.eventType);
                          return <Icon className="w-4 h-4" style={{ color: c.color }} />;
                        })()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-200 text-sm leading-tight max-w-[180px]">
                          {c.actor2Name || "Unknown Location"}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                          {c.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Block */}
                  <div className="space-y-2">
                    {/* Actors */}
                    <div className="flex items-center gap-2 text-xs bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-gray-500">Source:</span>
                      <span className="text-white font-medium truncate flex-1">
                        {c.actor1Name || "Unknown Force"}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {/* Casualties Block - HIGHLIGHTED */}
                      {c.casualties ? (
                        <div className="flex flex-col justify-center px-3 py-2 bg-red-950/30 border border-red-500/30 rounded text-center">
                          <div className="flex items-center justify-center gap-1.5 text-red-500 mb-0.5">
                            <Skull className="w-4 h-4" />
                            <span className="font-black text-sm">{c.casualties}</span>
                          </div>
                          <span className="text-[9px] text-red-400/70 uppercase font-bold tracking-wide">Casualties</span>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center px-3 py-2 bg-white/5 border border-white/5 rounded text-center opacity-50">
                          <span className="text-gray-400 text-xs">-</span>
                          <span className="text-[9px] text-gray-600 uppercase font-bold">No Casualties</span>
                        </div>
                      )}

                      {/* Duration Block */}
                      <div className="flex flex-col justify-center px-3 py-2 bg-white/5 border border-white/5 rounded text-center">
                        <span className="text-yellow-500 font-mono text-xs font-bold">
                          {c.duration || "New"}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Duration</span>
                      </div>
                    </div>

                    {/* Footer: Date & Source */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                      <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>Updated: {formatEventDate(c.date)}</span>
                      </div>

                      {c.sourceUrl && (
                        <a
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-blue-400/80 hover:text-blue-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Source Report</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>System Online</span>
            <span className="mx-2 text-gray-700">|</span>
            <span className="text-gray-600">Data: GDELT</span>
            <span className="ml-auto text-gray-700">v2.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Map Area */}
      <section className="flex-1 relative bg-black w-full h-full overflow-hidden">

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-50 p-2 bg-black/80 backdrop-blur text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors shadow-lg"
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
          <button
            onClick={() => setMapZoom(z => Math.min(z * 1.5, 8))}
            className="p-2 bg-black/80 backdrop-blur text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors shadow-lg"
            title="Zoom In"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMapZoom(z => Math.max(z / 1.5, 1))}
            className="p-2 bg-black/80 backdrop-blur text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors shadow-lg"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black pointer-events-none z-0" />
        <RiskMap
          conflicts={conflicts}
          center={mapCenter}
          zoom={mapZoom}
          selectedConflictId={selectedConflictId}
        />

        {/* Legend */}
        <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur px-3 py-2 rounded-lg border border-white/10">
          <div className="text-[10px] text-gray-400 mb-2 font-medium">Legend</div>
          <div className="space-y-1">
            {(["conflict", "protest", "cyber", "terrorism"] as EventType[]).map(type => (
              <div key={type} className="flex items-center gap-2 text-[10px]">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-black"
                  style={{ backgroundColor: EVENT_TYPES[type].color }}
                />
                <span className="text-gray-300">{EVENT_TYPES[type].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-white/50 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            UPLINK: ACTIVE
          </div>
        </div>
      </section>
    </main >
  )
}
