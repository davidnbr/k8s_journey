'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { phases } from '@/content/index'
import { getModuleStatus, type ModuleStatus } from '@/lib/progress'

const DIFFICULTY_DOT: Record<string, string> = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
}

function StatusIcon({ status }: { status: ModuleStatus }) {
  if (status === 'completed') return <span className="text-emerald-400 text-xs">✓</span>
  if (status === 'in_progress') return <span className="text-blue-400 text-xs">◉</span>
  return <span className="text-slate-700 text-xs">○</span>
}

export default function Sidebar() {
  const pathname = usePathname()
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>({})

  const refreshStatuses = () => {
    const s: Record<string, ModuleStatus> = {}
    for (const phase of phases) {
      for (const mod of phase.modules) {
        s[`${phase.slug}:${mod.slug}`] = getModuleStatus(phase.slug, mod.slug)
      }
    }
    setStatuses(s)
  }

  useEffect(() => {
    refreshStatuses()
    window.addEventListener('k8s-progress-change', refreshStatuses)
    return () => window.removeEventListener('k8s-progress-change', refreshStatuses)
  }, [])

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 h-full overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-k8s-blue/20 border border-k8s-blue/50 flex items-center justify-center text-xs font-bold text-k8s-blue-light">
            K8s
          </div>
          <span className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors">
            K8s Course
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        <Link
          href="/learn"
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
            pathname === '/learn'
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="text-base">🗺️</span> Course Overview
        </Link>

        {phases.map((phase) => {
          const completedCount = phase.modules.filter(
            (m) => statuses[`${phase.slug}:${m.slug}`] === 'completed'
          ).length
          const pct = Math.round((completedCount / phase.modules.length) * 100)

          return (
            <div key={phase.id}>
              {/* Phase header */}
              <div className="px-2 mb-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${phase.color}`}>
                    {phase.shortTitle}
                  </span>
                  {completedCount > 0 && (
                    <span className="text-[10px] text-slate-500">
                      {completedCount}/{phase.modules.length}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-0.5">
                {phase.modules.map((mod) => {
                  const href = `/learn/${phase.slug}/${mod.slug}`
                  const isActive = pathname === href
                  const status = statuses[`${phase.slug}:${mod.slug}`] ?? 'not_started'

                  return (
                    <Link
                      key={mod.id}
                      href={href}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                          : status === 'completed'
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <StatusIcon status={status} />
                      <span className="flex-1 truncate">{mod.title}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DIFFICULTY_DOT[mod.difficulty]}`} />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Coming soon */}
        <div>
          <div className="px-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              More phases coming…
            </span>
          </div>
          {['Networking', 'Operations', 'Advanced'].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-700 cursor-not-allowed"
            >
              <span className="text-slate-800">○</span>
              <span className="truncate">{t}</span>
              <span className="text-[9px] bg-slate-800 text-slate-600 px-1 rounded ml-auto">soon</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="text-[10px] text-slate-600 text-center">
          Kubernetes v1.35 · March 2026
        </div>
      </div>
    </aside>
  )
}
