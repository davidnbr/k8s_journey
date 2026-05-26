'use client'

import { useEffect, useState } from 'react'
import type { ClusterState, PodState, ServiceState } from '@/lib/types'

interface Props {
  state: ClusterState
}

const STATUS_COLORS: Record<string, string> = {
  Running: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
  Pending: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
  Failed: 'bg-red-500/20 border-red-500 text-red-300',
  Terminated: 'bg-slate-700 border-slate-600 text-slate-500',
}

const STATUS_DOT: Record<string, string> = {
  Running: 'bg-emerald-400',
  Pending: 'bg-yellow-400 animate-pulse-dot',
  Failed: 'bg-red-400',
  Terminated: 'bg-slate-600',
}

const COMPONENT_HIGHLIGHT: Record<string, string> = {
  apiserver: 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900',
  etcd: 'ring-2 ring-violet-400 ring-offset-1 ring-offset-slate-900',
  scheduler: 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900',
  controller: 'ring-2 ring-orange-400 ring-offset-1 ring-offset-slate-900',
  kubelet: 'ring-2 ring-green-400 ring-offset-1 ring-offset-slate-900',
  proxy: 'ring-2 ring-pink-400 ring-offset-1 ring-offset-slate-900',
}

function isPodMatched(pod: PodState, svc: ServiceState): boolean {
  if (!svc.selector || Object.keys(svc.selector).length === 0) return false
  return Object.entries(svc.selector).every(([k, v]) => pod.labels?.[k] === v)
}

function PodCard({ pod, isNew, isTargeted }: { pod: PodState; isNew: boolean; isTargeted: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  const shortName = pod.name.length > 14 ? pod.name.slice(0, 12) + '…' : pod.name
  const shortImage = pod.image.split(':')[0].split('/').pop() ?? pod.image

  return (
    <div
      className={`
        border rounded px-2 py-1.5 text-xs font-mono transition-all duration-300
        ${isTargeted
          ? 'bg-blue-500/20 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)] scale-[1.03] z-10'
          : (STATUS_COLORS[pod.status] ?? STATUS_COLORS.Pending)}
        ${isNew ? 'animate-fade-in' : ''}
        ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[pod.status]}`} />
        <span className="truncate font-semibold">{shortName}</span>
      </div>
      <div className="text-[10px] opacity-70 truncate">{shortImage}</div>
    </div>
  )
}

function ServiceBadge({
  svc,
  matchedPods,
  onHover,
  isHovered
}: {
  svc: ServiceState
  matchedPods: PodState[]
  onHover: (id: string | null) => void
  isHovered: boolean
}) {
  const typeColors: Record<string, string> = {
    ClusterIP: 'bg-blue-500/15 border-blue-500/50 text-blue-300',
    NodePort: 'bg-orange-500/15 border-orange-500/50 text-orange-300',
    LoadBalancer: 'bg-purple-500/15 border-purple-500/50 text-purple-300',
  }

  const hoverRing = isHovered ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 scale-[1.02]' : ''

  return (
    <div
      onMouseEnter={() => onHover(svc.id)}
      onMouseLeave={() => onHover(null)}
      className={`border rounded px-2 py-1.5 text-xs font-mono animate-slide-up transition-all duration-200 cursor-pointer ${typeColors[svc.type]} ${hoverRing}`}
    >
      <div className="font-bold flex items-center justify-between gap-4">
        <span>{svc.name}</span>
        <span className="text-[9px] opacity-75 font-normal">({matchedPods.length} endpoints)</span>
      </div>
      <div className="text-[10px] opacity-70">{svc.type} · :{svc.port}</div>
      <div className="text-[10px] opacity-60">{svc.clusterIP}</div>
      {matchedPods.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-700/40 text-[9px] opacity-80 flex flex-wrap gap-1">
          <span className="opacity-50">endpoints:</span>
          {matchedPods.map((p) => (
            <span key={p.id} className="bg-slate-950/40 px-1 rounded border border-slate-700/20 text-slate-300 font-mono">
              {p.name.length > 10 ? p.name.slice(0, 8) + '…' : p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ControlPlaneComponent({
  name, label, highlighted,
}: { name: string; label: string; highlighted: boolean }) {
  const colors: Record<string, string> = {
    apiserver: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
    etcd: 'bg-violet-500/10 border-violet-500/40 text-violet-300',
    scheduler: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
    controller: 'bg-orange-500/10 border-orange-500/40 text-orange-300',
  }

  return (
    <div
      className={`
        border rounded px-2 py-1 text-[10px] font-mono text-center transition-all duration-300
        ${colors[name] ?? 'bg-slate-700/30 border-slate-600 text-slate-400'}
        ${highlighted ? COMPONENT_HIGHLIGHT[name] ?? '' : ''}
      `}
    >
      <div className="font-bold truncate">{label}</div>
    </div>
  )
}

export default function ClusterDiagram({ state }: Props) {
  const [prevPodIds, setPrevPodIds] = useState<Set<string>>(new Set())
  const [newPodIds, setNewPodIds] = useState<Set<string>>(new Set())
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null)

  useEffect(() => {
    const currentIds = new Set(state.pods.map((p) => p.id))
    const fresh = new Set(Array.from(currentIds).filter((id) => !prevPodIds.has(id)))
    setNewPodIds(fresh)
    setPrevPodIds(currentIds)

    if (fresh.size > 0) {
      const t = setTimeout(() => setNewPodIds(new Set()), 1000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pods])

  const hl = state.highlightedComponent

  const node1Pods = state.pods.filter((p) => p.node === 'node-1')
  const node2Pods = state.pods.filter((p) => p.node === 'node-2')

  const hoveredService = state.services.find((s) => s.id === hoveredServiceId)

  const isPodTargeted = (pod: PodState) => {
    if (!hoveredService) return false
    return isPodMatched(pod, hoveredService)
  }

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 h-full flex flex-col gap-3 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest">Live Cluster</span>
        <span className="text-emerald-400 text-[10px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot inline-block" />
          v1.35
        </span>
      </div>

      {/* Control Plane */}
      <div className="border border-slate-600/60 rounded-lg p-2 bg-slate-900/40">
        <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
          <span>⚙</span> Control Plane
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ControlPlaneComponent name="apiserver" label="kube-apiserver" highlighted={hl === 'apiserver'} />
          <ControlPlaneComponent name="etcd" label="etcd" highlighted={hl === 'etcd'} />
          <ControlPlaneComponent name="scheduler" label="scheduler" highlighted={hl === 'scheduler'} />
          <ControlPlaneComponent name="controller" label="controller-mgr" highlighted={hl === 'controller'} />
        </div>
      </div>

      {/* Worker Nodes */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {/* Node 1 */}
        <div
          className={`border border-slate-600/60 rounded-lg p-2 bg-slate-900/30 transition-all duration-300 ${
            hl === 'kubelet' ? 'ring-1 ring-green-400/50' : ''
          }`}
        >
          <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <span>📦</span> node-1
          </div>
          {hl === 'kubelet' && (
            <div className="text-[9px] text-green-400/70 mb-1">kubelet ↻</div>
          )}
          <div className="grid grid-cols-1 gap-1 min-h-[40px]">
            {node1Pods.length === 0 && (
              <div className="text-slate-700 text-[10px] italic text-center py-2">empty</div>
            )}
            {node1Pods.map((pod) => (
              <PodCard
                key={pod.id}
                pod={pod}
                isNew={newPodIds.has(pod.id)}
                isTargeted={isPodTargeted(pod)}
              />
            ))}
          </div>
        </div>

        {/* Node 2 */}
        <div
          className={`border border-slate-600/60 rounded-lg p-2 bg-slate-900/30 transition-all duration-300 ${
            hl === 'kubelet' ? 'ring-1 ring-green-400/50' : ''
          }`}
        >
          <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <span>📦</span> node-2
          </div>
          <div className="grid grid-cols-1 gap-1 min-h-[40px]">
            {node2Pods.length === 0 && (
              <div className="text-slate-700 text-[10px] italic text-center py-2">empty</div>
            )}
            {node2Pods.map((pod) => (
              <PodCard
                key={pod.id}
                pod={pod}
                isNew={newPodIds.has(pod.id)}
                isTargeted={isPodTargeted(pod)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Deployments */}
      {state.deployments.length > 0 && (
        <div className="border border-slate-700/50 rounded-lg p-2 bg-slate-900/20 animate-fade-in">
          <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5">
            🚀 Deployments
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.deployments.map((dep) => {
              const ready = dep.availableReplicas === dep.replicas
              return (
                <div
                  key={dep.id}
                  className={`border rounded px-2 py-1 text-xs font-mono animate-slide-up ${
                    ready
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse-dot'}`} />
                    {dep.name}
                  </div>
                  <div className="text-[10px] opacity-70">
                    {dep.availableReplicas}/{dep.replicas} ready · {dep.image.split(':')[0].split('/').pop()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Services */}
      {state.services.length > 0 && (
        <div className="border border-slate-700/50 rounded-lg p-2 bg-slate-900/20 animate-fade-in">
          <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5">
            🔌 Services
          </div>
          <div className="flex flex-col gap-1.5">
            {state.services.map((svc) => {
              const matched = state.pods.filter((p) => isPodMatched(p, svc))
              return (
                <ServiceBadge
                  key={svc.id}
                  svc={svc}
                  matchedPods={matched}
                  onHover={setHoveredServiceId}
                  isHovered={hoveredServiceId === svc.id}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Events */}
      {state.events.length > 0 && (
        <div className="border-t border-slate-800 pt-2">
          <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1">Events</div>
          {state.events.slice(-3).map((e, i) => (
            <div key={i} className="text-[10px] text-slate-400 animate-slide-up truncate">
              <span className="text-emerald-500 mr-1">›</span>{e}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {state.pods.length === 0 && state.services.length === 0 && !state.highlightedComponent && (
        <div className="flex-1 flex items-center justify-center text-slate-700 text-xs">
          Run a command to see the cluster state
        </div>
      )}
    </div>
  )
}
