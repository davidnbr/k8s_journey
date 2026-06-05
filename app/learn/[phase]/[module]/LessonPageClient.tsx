'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getModule, getPhase, getNextModule, getPrevModule } from '@/content/index'
import { getModuleReview } from '@/content/reviewMatrix'
import {
  getExerciseTasks,
  getModuleMasteryChecks,
  spacedReviewCadence,
} from '@/content/learningDesign'
import {
  markStepReached, markModuleCompleted, getModuleStatus,
  markReviewDone, getNextReviewDue, getReviewProgress, REVIEW_INTERVALS,
  type ReviewIntervalIndex,
} from '@/lib/progress'
import type { ClusterState } from '@/lib/types'
import ScriptedTerminal from '@/components/ScriptedTerminal'
import ClusterDiagram from '@/components/ClusterDiagram'
import QuizCard from '@/components/QuizCard'

interface PageProps {
  params: Promise<{ phase: string; module: string }>
}

// Strip executable HTML — defence-in-depth for authored content
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=[^\s>]*/gi, '')
}

// Inline formatting: bold, code, links
function formatInline(text: string): string {
  const html = text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-800 text-blue-300 text-xs px-1.5 py-0.5 rounded font-mono">$1</code>')
  return sanitizeHtml(html)
}

// Render theory markdown-ish text to JSX
function TheoryContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []
  let codeIndent = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLines = []
        const match = line.match(/^(\s*)```/)
        codeIndent = match ? match[1].length : 0
      } else {
        inCode = false
        elements.push(
          <pre key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-[1.2] mb-4">
            {codeLines.join('\n')}
          </pre>
        )
      }
      i++
      continue
    }

    if (inCode) {
      let cleanLine = line
      if (codeIndent > 0) {
        const regex = new RegExp(`^\\s{0,${codeIndent}}`)
        cleanLine = line.replace(regex, '')
      }
      codeLines.push(cleanLine)
      i++
      continue
    }

    // Headings
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
    }
    // Tables
    else if (line.startsWith('| ')) {
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
                      <td key={ci} className="text-slate-300 text-xs border-b border-slate-800 py-2 pr-4"
                        dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
      continue
    }
    // Callout blocks: > [!TIP], > [!NOTE], > [!WARNING], > [!IMPORTANT]
    else if (/^>\s*\[!(TIP|NOTE|WARNING|IMPORTANT|CAUTION)\]/.test(line)) {
      const match = line.match(/^>\s*\[!(TIP|NOTE|WARNING|IMPORTANT|CAUTION)\]/)!
      const type = match[1]
      const calloutLines: string[] = []
      i++ // skip the type line
      while (i < lines.length && lines[i].startsWith('> ')) {
        calloutLines.push(lines[i].slice(2))
        i++
      }
      const colorMap: Record<string, { border: string; bg: string; text: string; icon: string }> = {
        TIP: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-300', icon: '💡' },
        NOTE: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-300', icon: 'ℹ️' },
        WARNING: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-300', icon: '⚠️' },
        IMPORTANT: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', text: 'text-violet-300', icon: '❗' },
        CAUTION: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-300', icon: '🔴' },
      }
      const c = colorMap[type] ?? colorMap.NOTE
      elements.push(
        <div key={`callout-${i}`} className={`${c.bg} border ${c.border} rounded-lg p-4 mb-4`}>
          <div className={`flex items-center gap-2 font-semibold text-xs uppercase tracking-wider ${c.text} mb-2`}>
            <span>{c.icon}</span> {type}
          </div>
          <div className="text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: calloutLines.map(formatInline).join('<br/>') }} />
        </div>
      )
      continue
    }
    // Blockquotes — detect Brain Warm-Up vs generic
    else if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      const text = quoteLines.join(' ')
      const isBrainWarmup = text.includes('🧠') || text.toLowerCase().includes('brain warm-up')
      if (isBrainWarmup) {
        elements.push(
          <div key={`bq-${i}`} className="bg-violet-500/8 border border-violet-500/30 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-widest mb-2">
              <span>🧠</span> Brain Warm-Up
            </div>
            <div className="text-slate-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: quoteLines.map(formatInline).join(' ')
                .replace(/^🧠\s*\*\*Brain Warm-Up\*\*:\s*/i, '')
                .replace(/^Brain Warm-Up:\s*/i, '') }} />
          </div>
        )
      } else {
        elements.push(
          <blockquote key={`bq-${i}`} className="border-l-2 border-slate-600 pl-4 py-1 mb-3 text-slate-400 text-sm italic leading-relaxed">
            {quoteLines.map((ql, qi) => (
              <span key={qi} dangerouslySetInnerHTML={{ __html: formatInline(ql) }} />
            ))}
          </blockquote>
        )
      }
      continue
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside text-slate-300 text-sm space-y-1 mb-3 pl-2">
          {items.map((item, ii) => (
            <li key={ii} className="leading-relaxed" dangerouslySetInnerHTML={{
              __html: formatInline(item)
            }} />
          ))}
        </ol>
      )
      continue
    }
    // Unordered lists (with nested support)
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: { text: string; indent: number }[] = []
      while (i < lines.length && (/^(\s*)([-*])\s/.test(lines[i]))) {
        const match = lines[i].match(/^(\s*)([-*])\s(.*)/)
        if (match) {
          items.push({ text: match[3], indent: match[1].length })
        }
        i++
      }
      // Group by indent level — render nested as sub-lists
      const renderList = (itemList: { text: string; indent: number }[], baseIndent: number) => {
        const result: React.ReactNode[] = []
        let j = 0
        while (j < itemList.length) {
          const item = itemList[j]
          if (item.indent === baseIndent) {
            // Collect any children (higher indent)
            const children: { text: string; indent: number }[] = []
            j++
            while (j < itemList.length && itemList[j].indent > baseIndent) {
              children.push(itemList[j])
              j++
            }
            result.push(
              <li key={j} className="leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: formatInline(item.text) }} />
                {children.length > 0 && (
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-400">
                    {renderList(children, children[0].indent)}
                  </ul>
                )}
              </li>
            )
          } else {
            j++
          }
        }
        return result
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside text-slate-300 text-sm space-y-1 mb-3 pl-2">
          {renderList(items, items[0]?.indent ?? 0)}
        </ul>
      )
      continue
    }
    // Horizontal rule
    else if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className="border-slate-800 my-6" />)
    }
    // Empty line
    else if (line.trim() === '') {
      // skip blank
    }
    // Normal paragraph
    else {
      elements.push(
        <p key={i} className="text-slate-300 text-base leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
    i++
  }

  return <div>{elements}</div>
}
function PracticeTab({
  phaseSlug,
  mod,
}: {
  phaseSlug: string
  mod: NonNullable<ReturnType<typeof getModule>>
}) {
  const review = getModuleReview(phaseSlug, mod.slug)
  const masteryChecks = getModuleMasteryChecks(mod)
  const exerciseTasks = mod.exercises?.length ? mod.exercises : getExerciseTasks(mod, review)

  const masteryKey = `k8s-practice-mastery:${phaseSlug}:${mod.slug}`
  const doneKey = `k8s-practice-done:${phaseSlug}:${mod.slug}`

  const [checkedItems, setCheckedItems] = useState<Set<number>>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(masteryKey) : null
      return stored ? new Set<number>(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })
  const [doneExercises, setDoneExercises] = useState<Set<string>>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(doneKey) : null
      return stored ? new Set<string>(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })
  const [revealedSolutions, setRevealedSolutions] = useState<Set<string>>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(doneKey) : null
      return stored ? new Set<string>(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    try { localStorage.setItem(masteryKey, JSON.stringify([...checkedItems])) } catch { /* ignore */ }
  }, [checkedItems, masteryKey])

  useEffect(() => {
    try { localStorage.setItem(doneKey, JSON.stringify([...doneExercises])) } catch { /* ignore */ }
  }, [doneExercises, doneKey])

  const allChecked = masteryChecks.length > 0 && checkedItems.size === masteryChecks.length

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleDone = (id: string) => {
    setDoneExercises((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const uniqueSourceRefs = review?.sourceRefs.filter(
    (ref, i, arr) => arr.findIndex((r) => r.url === ref.url) === i
  ) ?? []

  return (
    <div className="space-y-8 pb-8">
      {/* Mastery checklist */}
      {masteryChecks.length > 0 && <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Mastery checks · tick only when you can do it from memory
        </h2>
        <ul className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {masteryChecks.map((item, index) => {
            const checked = checkedItems.has(index)
            return (
              <li key={index}>
                <button
                  onClick={() => toggleCheck(index)}
                  className={`w-full text-left flex items-center gap-4 px-4 py-3.5 text-sm transition-colors ${
                    checked ? 'bg-emerald-500/8 text-emerald-300' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`flex-shrink-0 text-base leading-none ${checked ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {checked ? '✓' : '○'}
                  </span>
                  <span className={checked ? 'line-through decoration-emerald-600 opacity-60' : ''}>{item}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {allChecked && (
          <p className="mt-2 text-xs text-emerald-400 pl-1">All done — move on.</p>
        )}
      </section>}

      {/* Challenge exercises */}
      {exerciseTasks.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Challenges · attempt first, reveal only if stuck
          </h2>
          <div className="space-y-3">
            {exerciseTasks.map((task) => {
              const revealed = revealedSolutions.has(task.id)
              const done = doneExercises.has(task.id)
              return (
                <div key={task.id} className={`border rounded-xl overflow-hidden transition-colors ${done ? 'border-emerald-500/25' : 'border-slate-800'}`}>
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">{task.kind}</span>
                    <p className="flex-1 text-sm font-medium text-slate-200">{task.title}</p>
                    <button
                      onClick={() => toggleDone(task.id)}
                      className={`text-xs px-2.5 py-1 rounded border transition-all ${
                        done ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {done ? '✓' : 'done?'}
                    </button>
                  </div>

                  {/* Goal */}
                  <p className="px-4 pb-3 text-sm text-slate-400 leading-relaxed">{task.goal}</p>

                  {/* Solution */}
                  <div className="border-t border-slate-800">
                    <button
                      onClick={() => toggleSolution(task.id)}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
                    >
                      <span>{revealed ? '▾' : '▸'}</span>
                      <span>{revealed ? 'Hide solution' : 'Show solution'}</span>
                    </button>

                    {revealed && (
                      <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-4 space-y-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-semibold">Run</span>
                          <pre className="mt-1.5 text-xs text-cyan-200 font-mono whitespace-pre-wrap leading-relaxed">{task.commands.join('\n')}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Verify</span>
                          <pre className="mt-1.5 text-xs text-emerald-200 font-mono whitespace-pre-wrap leading-relaxed">{task.verify.join('\n')}</pre>
                          {task.expectedOutcome && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{task.expectedOutcome}</p>}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">Cleanup</span>
                          <pre className="mt-1.5 text-xs text-amber-200 font-mono whitespace-pre-wrap leading-relaxed">{task.cleanup.join('\n')}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Official docs */}
      {uniqueSourceRefs.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Docs</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueSourceRefs.map((ref, i) => (
              <a
                key={`${ref.url}-${i}`}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-all"
              >
                {ref.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const TABS = [
  { id: 'theory' as const, label: '📖 Theory' },
  { id: 'lab' as const, label: '▶ Lab' },
  { id: 'quiz' as const, label: '🧠 Quiz' },
  { id: 'practice' as const, label: '⚙ Practice' },
]

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
  const [activeTab, setActiveTab] = useState<'theory' | 'lab' | 'quiz' | 'practice'>('theory')
  const [nextReview, setNextReview] = useState<ReturnType<typeof getNextReviewDue>>(null)
  const [reviewProgress, setReviewProgress] = useState<{ done: number; total: number }>({ done: 0, total: 4 })

  const refreshReviewState = useCallback(() => {
    setNextReview(getNextReviewDue(phaseSlug, moduleSlug))
    setReviewProgress(getReviewProgress(phaseSlug, moduleSlug))
  }, [phaseSlug, moduleSlug])

  useEffect(() => {
    markStepReached(phaseSlug, moduleSlug)
    const status = getModuleStatus(phaseSlug, moduleSlug)
    if (status === 'completed') {
      setLabDone(true)
      setQuizDone(true)
    }
    refreshReviewState()
    window.addEventListener('k8s-progress-change', refreshReviewState)
    return () => window.removeEventListener('k8s-progress-change', refreshReviewState)
  }, [phaseSlug, moduleSlug, refreshReviewState])

  const handleMarkReviewDone = useCallback(() => {
    if (nextReview === null) return
    markReviewDone(phaseSlug, moduleSlug, nextReview.intervalIndex as ReviewIntervalIndex)
  }, [phaseSlug, moduleSlug, nextReview])

  const handleLabComplete = useCallback(() => {
    setLabDone(true)
    setActiveTab('quiz')
  }, [])

  const handleQuizComplete = useCallback(() => {
    setQuizDone(true)
    markModuleCompleted(phaseSlug, moduleSlug)
  }, [phaseSlug, moduleSlug])

  const isModuleDone = labDone && quizDone

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
            <span className="text-xs text-slate-600 font-mono">
              {phase.modules.findIndex(m => m.slug === moduleSlug) + 1}/{phase.modules.length}
            </span>
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
      <div role="tablist" aria-label="Lesson sections" className="flex-shrink-0 flex gap-1 px-6 pt-4 pb-0 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={tab.id + '-panel'}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-300 bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.id === 'theory' && isModuleDone && (
              <span className="ml-1 text-emerald-400 text-xs">✓</span>
            )}
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
          <div role="tabpanel" id="theory-panel" className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest ${phase.color}`}>
                  {phase.shortTitle}
                </span>
                <h1 className="text-2xl font-bold text-slate-100 mt-1">{mod.title}</h1>
                <p className="text-slate-400 text-sm mt-1">{mod.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    mod.difficulty === 'beginner'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : mod.difficulty === 'intermediate'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>{mod.difficulty}</span>
                  <span className="text-slate-600 text-xs">{mod.duration}</span>
                  <span className="text-slate-500 text-xs">Read → Lab → Quiz → Practice</span>
                </div>
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
          <div role="tabpanel" id="lab-panel" className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 overflow-hidden">
            {/* Terminal (left) */}
            <div className="p-4 overflow-hidden flex flex-col min-h-0">
              <ScriptedTerminal
                key={moduleSlug}
                steps={mod.labSteps}
                onStateChange={setClusterState}
                onComplete={handleLabComplete}
              />
            </div>
            {/* Diagram (right) — hidden on small screens */}
            <div className="hidden lg:flex flex-col p-4 border-l border-slate-800 overflow-hidden">
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
          <div role="tabpanel" id="quiz-panel" className="h-full overflow-y-auto">
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

              {quizDone && (
                <div className="mt-4 bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
                  <p className="text-violet-300 text-sm font-semibold mb-1">Solidify your learning</p>
                  <p className="text-slate-400 text-xs mb-3">Run the challenge exercises and tick the mastery checks before moving on.</p>
                  <button
                    onClick={() => setActiveTab('practice')}
                    className="text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Go to Practice →
                  </button>
                </div>
              )}

              {quizDone && (
                <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-slate-300 text-sm font-semibold">Spaced Review Schedule</h3>
                    <span className="text-xs text-slate-500">{reviewProgress.done}/{reviewProgress.total} reviews done</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {REVIEW_INTERVALS.map((days, i) => {
                      const isDone = i < reviewProgress.done
                      const isNext = nextReview?.intervalIndex === i
                      return (
                        <div
                          key={days}
                          className={`rounded-lg p-2 text-center border text-xs transition-all ${
                            isDone
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : isNext
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                              : 'bg-slate-900 border-slate-800 text-slate-600'
                          }`}
                        >
                          <div className="font-bold text-sm">{isDone ? '✓' : `Day ${days}`}</div>
                          <div className="text-[10px] mt-0.5 opacity-70">
                            {isDone ? 'done' : isNext ? 'due' : `+${days}d`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {nextReview && nextReview.intervalIndex < REVIEW_INTERVALS.length && (
                    <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <div className="text-xs">
                        <span className="text-blue-300 font-semibold">
                          Day {REVIEW_INTERVALS[nextReview.intervalIndex]} review
                        </span>
                        {nextReview.overdueDays > 0 && (
                          <span className="text-red-400 ml-2">{nextReview.overdueDays}d overdue</span>
                        )}
                        {nextReview.overdueDays === 0 && nextReview.dueAt <= Date.now() && (
                          <span className="text-amber-400 ml-2">due today</span>
                        )}
                        <p className="text-slate-500 mt-0.5">
                          {spacedReviewCadence[nextReview.intervalIndex]}
                        </p>
                      </div>
                      <button
                        onClick={handleMarkReviewDone}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ml-3 shrink-0"
                      >
                        Mark done
                      </button>
                    </div>
                  )}
                  {reviewProgress.done === reviewProgress.total && (
                    <div className="text-center text-xs text-emerald-400 py-2">
                      All spaced reviews complete — long-term retention secured.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Practice tab */}
        {activeTab === 'practice' && (
          <div role="tabpanel" id="practice-panel" className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6">
              {!isModuleDone && (
                <div className="mb-6 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">⚠</span>
                  <p className="text-amber-300 text-sm">Complete the Lab and Quiz first — then use these exercises to test yourself.</p>
                </div>
              )}
              <PracticeTab phaseSlug={phaseSlug} mod={mod} />
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
        ) : (
          <div className="text-right">
            <div className="text-slate-600 text-[10px]">Phase complete</div>
            <Link href="/learn" className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors">
              Back to overview →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
