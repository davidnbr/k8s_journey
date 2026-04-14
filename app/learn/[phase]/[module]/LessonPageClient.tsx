'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getModule, getPhase, getNextModule, getPrevModule } from '@/content/index'
import { markStepReached, markModuleCompleted, getModuleStatus } from '@/lib/progress'
import type { ClusterState } from '@/lib/types'
import ScriptedTerminal from '@/components/ScriptedTerminal'
import ClusterDiagram from '@/components/ClusterDiagram'
import QuizCard from '@/components/QuizCard'

interface PageProps {
  params: Promise<{ phase: string; module: string }>
}

// Render theory markdown-ish text to JSX
function TheoryContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLines = []
      } else {
        inCode = false
        elements.push(
          <pre key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed mb-4">
            {codeLines.join('\n')}
          </pre>
        )
      }
      i++
      continue
    }

    if (inCode) {
      codeLines.push(line)
      i++
      continue
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-slate-100 mt-6 mb-3 border-b border-slate-800 pb-2">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-slate-200 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('| ')) {
      // Table
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const [header, , ...rows] = tableLines
      const headers = header.split('|').filter((c) => c.trim()).map((c) => c.trim())
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split('|').filter((c) => c.trim()).map((c) => c.trim())
                return (
                  <tr key={ri}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="text-slate-300 text-xs border-b border-slate-800 py-2 pr-4">
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
      continue
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside text-slate-300 text-sm space-y-1 mb-3 pl-2">
          {items.map((item, ii) => (
            <li key={ii} className="leading-relaxed" dangerouslySetInnerHTML={{
              __html: item
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
                .replace(/`(.+?)`/g, '<code class="bg-slate-800 text-blue-300 text-xs px-1.5 py-0.5 rounded font-mono">$1</code>')
            }} />
          ))}
        </ul>
      )
      continue
    } else if (line.trim() === '') {
      // skip blank
    } else {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-800 text-blue-300 text-xs px-1.5 py-0.5 rounded font-mono">$1</code>')
      elements.push(
        <p key={i} className="text-slate-300 text-sm leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: html }} />
      )
    }
    i++
  }

  return <div>{elements}</div>
}

export default function LessonPageClient({ params }: PageProps) {
  const { phase: phaseSlug, module: moduleSlug } = use(params)

  const phase = getPhase(phaseSlug)
  const mod = getModule(phaseSlug, moduleSlug)
  if (!phase || !mod) notFound()

  const next = getNextModule(phaseSlug, moduleSlug)
  const prev = getPrevModule(phaseSlug, moduleSlug)

  const [clusterState, setClusterState] = useState<ClusterState>(
    mod.labSteps[0]?.clusterState ?? { pods: [], services: [], deployments: [], namespaces: ['default'], events: [] }
  )
  const [labDone, setLabDone] = useState(false)
  const [quizDone, setQuizDone] = useState(false)
  const [activeTab, setActiveTab] = useState<'theory' | 'lab' | 'quiz'>('theory')

  useEffect(() => {
    markStepReached(phaseSlug, moduleSlug)
    const status = getModuleStatus(phaseSlug, moduleSlug)
    if (status === 'completed') {
      setLabDone(true)
      setQuizDone(true)
    }
  }, [phaseSlug, moduleSlug])

  const handleLabComplete = useCallback(() => {
    setLabDone(true)
    setActiveTab('quiz')
  }, [])

  const handleQuizComplete = useCallback(() => {
    setQuizDone(true)
    markModuleCompleted(phaseSlug, moduleSlug)
  }, [phaseSlug, moduleSlug])

  const isModuleDone = labDone && quizDone

  const TABS = [
    { id: 'theory' as const, label: '📖 Theory', always: true },
    { id: 'lab' as const, label: '▶ Lab', always: true },
    { id: 'quiz' as const, label: '🧠 Quiz', always: true },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/learn" className="hover:text-slate-300 transition-colors">Course</Link>
            <span>/</span>
            <span className={phase.color}>{phase.shortTitle}</span>
            <span>/</span>
            <span className="text-slate-300">{mod.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">{mod.duration}</span>
            {isModuleDone && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ✓ Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 px-6 pt-4 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-300 bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.id === 'lab' && labDone && (
              <span className="ml-1 text-emerald-400 text-xs">✓</span>
            )}
            {tab.id === 'quiz' && quizDone && (
              <span className="ml-1 text-emerald-400 text-xs">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* Theory tab */}
        {activeTab === 'theory' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest ${phase.color}`}>
                  {phase.shortTitle}
                </span>
                <h1 className="text-2xl font-bold text-slate-100 mt-1">{mod.title}</h1>
                <p className="text-slate-400 text-sm mt-1">{mod.description}</p>
              </div>

              <TheoryContent text={mod.theory} />

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setActiveTab('lab')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Start the Lab →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lab tab */}
        {activeTab === 'lab' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 overflow-hidden">
            {/* Terminal (left) */}
            <div className="p-4 overflow-hidden flex flex-col min-h-0">
              <ScriptedTerminal
                key={moduleSlug}
                steps={mod.labSteps}
                onStateChange={setClusterState}
                onComplete={handleLabComplete}
              />
            </div>
            {/* Diagram (right) */}
            <div className="p-4 border-l border-slate-800 overflow-hidden flex flex-col">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">
                Live Cluster State
              </div>
              <div className="flex-1 min-h-0">
                <ClusterDiagram state={clusterState} />
              </div>
            </div>
          </div>
        )}

        {/* Quiz tab */}
        {activeTab === 'quiz' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-100">Active Recall</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Answer before revealing. The struggle to recall builds stronger memory.
                </p>
              </div>
              <QuizCard
                key={moduleSlug}
                questions={mod.quiz}
                onComplete={handleQuizComplete}
              />

              {quizDone && next && (
                <div className="mt-6 bg-slate-900 border border-slate-700 rounded-xl p-4 animate-slide-up">
                  <div className="text-xs text-slate-500 mb-1">Up next</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-xs font-bold ${next.phase.color}`}>{next.phase.shortTitle}</div>
                      <div className="text-slate-200 font-semibold text-sm">{next.module.title}</div>
                    </div>
                    <Link
                      href={`/learn/${next.phase.slug}/${next.module.slug}`}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      Next Module →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 border-t border-slate-800 px-6 py-3 flex items-center justify-between bg-slate-900/60">
        {prev ? (
          <Link
            href={`/learn/${prev.phase.slug}/${prev.module.slug}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-xs"
          >
            <span>←</span>
            <div className="text-left">
              <div className="text-slate-600 text-[10px]">Previous</div>
              <div>{prev.module.title}</div>
            </div>
          </Link>
        ) : <div />}

        {next ? (
          <Link
            href={`/learn/${next.phase.slug}/${next.module.slug}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-xs"
          >
            <div className="text-right">
              <div className="text-slate-600 text-[10px]">Next</div>
              <div>{next.module.title}</div>
            </div>
            <span>→</span>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}
