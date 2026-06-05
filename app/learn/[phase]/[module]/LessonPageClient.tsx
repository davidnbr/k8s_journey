'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getModule, getPhase, getNextModule, getPrevModule } from '@/content/index'
import { getModuleReview } from '@/content/reviewMatrix'
import {
  getCommandFamilies,
  getCoverageGaps,
  getExerciseTasks,
  getExternalTools,
  getLocalPracticeChecklist,
  getModuleKeyConcepts,
  getModuleLearningObjectives,
  getModuleMasteryChecks,
  getModulePracticePrompts,
  getRunnableCommands,
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

// Inline formatting: bold, code, links
function formatInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-800 text-blue-300 text-xs px-1.5 py-0.5 rounded font-mono">$1</code>')
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
    // Blockquotes
    else if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-slate-600 pl-4 py-1 mb-3 text-slate-400 text-sm italic leading-relaxed">
          {quoteLines.map((ql, qi) => (
            <span key={qi} dangerouslySetInnerHTML={{ __html: formatInline(ql) }} />
          ))}
        </blockquote>
      )
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
        <p key={i} className="text-slate-300 text-sm leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
    i++
  }

  return <div>{elements}</div>
}

function LearningContract({
  phaseSlug,
  mod,
}: {
  phaseSlug: string
  mod: NonNullable<ReturnType<typeof getModule>>
}) {
  const review = getModuleReview(phaseSlug, mod.slug)
  const exerciseTasks = mod.exercises?.length ? mod.exercises : getExerciseTasks(mod, review)
  const commandFamilies = getCommandFamilies(mod)
  const runnableCommands = getRunnableCommands(mod)
  const externalTools = getExternalTools(mod)
  const coverageGaps = getCoverageGaps(mod)

  const sections = [
    {
      title: 'Learning Objectives',
      eyebrow: 'What you must be able to do',
      items: getModuleLearningObjectives(mod),
      tone: 'border-blue-500/25 bg-blue-500/5 text-blue-300',
    },
    {
      title: 'Retrieval Targets',
      eyebrow: 'Recall these without notes',
      items: getModuleKeyConcepts(mod),
      tone: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300',
    },
    {
      title: 'Practice Exercises',
      eyebrow: 'Do, predict, troubleshoot',
      items: getModulePracticePrompts(mod),
      tone: 'border-amber-500/25 bg-amber-500/5 text-amber-300',
    },
    {
      title: 'Mastery Checks',
      eyebrow: 'Move on only when true',
      items: getModuleMasteryChecks(mod),
      tone: 'border-slate-600 bg-slate-900/70 text-slate-300',
    },
  ]

  return (
    <div className="mb-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
        <div className="text-[11px] text-blue-300 font-bold uppercase tracking-widest mb-1">
          Evidence-Based Learning Loop
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Preview the idea, predict the result, run the guided lab, explain what changed,
          then repeat a variant from memory. This combines retrieval practice, spaced
          review, worked examples, and transfer practice.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {sections.map((section) => (
          <section key={section.title} className={`border rounded-xl p-4 ${section.tone}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
              {section.eyebrow}
            </div>
            <h2 className="text-sm font-bold text-slate-100 mb-2">{section.title}</h2>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                  <span className="text-slate-500 mt-0.5">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <details className="mt-3 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">
          Spaced Review Schedule
        </summary>
        <ul className="mt-3 space-y-1.5">
          {spacedReviewCadence.map((item) => (
            <li key={item} className="text-xs text-slate-400 leading-relaxed flex gap-2">
              <span className="text-blue-400 mt-0.5">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] text-cyan-300 font-bold uppercase tracking-widest mb-1">
              June 2026 Review + Local Practice Runbook
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              These are the concrete commands and procedures you should run on your computer,
              against a local throwaway minikube cluster unless the module explicitly states otherwise.
            </p>
          </div>
          <span className={`text-[10px] border rounded-full px-2 py-1 ${
            review?.reviewStatus === 'verified' && coverageGaps.length === 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}>
            {review?.reviewStatus === 'verified' && coverageGaps.length === 0
              ? 'June 2026 verified'
              : review?.reviewStatus ?? `${coverageGaps.length} gap${coverageGaps.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {review && (
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div className="border border-emerald-500/20 rounded-xl p-3 bg-emerald-500/5">
              <h3 className="text-emerald-300 text-xs font-semibold mb-2">Validated Against</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {review.verifiedAgainst.map((item) => (
                  <span key={item} className="text-[10px] bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 rounded-full px-2 py-1">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400">Checked: {review.verifiedAt}</p>
            </div>

            <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50">
              <h3 className="text-slate-200 text-xs font-semibold mb-2">Official Sources</h3>
              <ul className="space-y-1.5">
                {review.sourceRefs.slice(0, 6).map((source) => (
                  <li key={`${source.title}-${source.url}`} className="text-xs leading-relaxed">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline underline-offset-2">
                      {source.title}
                    </a>
                    <span className="text-slate-500"> · {source.scope} · checked {source.checkedAt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50">
            <h3 className="text-slate-200 text-xs font-semibold mb-2">Before Running Commands</h3>
            <ul className="space-y-1.5">
              {getLocalPracticeChecklist(mod).map((item) => (
                <li key={item} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                  <span className="text-cyan-400 mt-0.5">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50">
            <h3 className="text-slate-200 text-xs font-semibold mb-2">Tools and Plugins</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-2 py-1">
                kubectl
              </span>
              {externalTools.map((tool) => (
                <span key={tool} className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded-full px-2 py-1">
                  {tool}
                </span>
              ))}
            </div>
            {commandFamilies.length > 0 ? (
              <ul className="space-y-1.5">
                {commandFamilies.map((family) => (
                  <li key={family.name} className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-200">{family.name}:</span> {family.purpose}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No runnable command family detected for this module.</p>
            )}
          </div>
        </div>

        {review && (
          <div className="mb-3 border border-slate-800 rounded-xl p-3 bg-slate-950/50">
            <h3 className="text-slate-200 text-xs font-semibold mb-2">Topic Coverage Reviewed</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {Object.entries(review.coverage).map(([key, values]) => (
                <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{key}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{values.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {coverageGaps.length > 0 && (
          <div className="mb-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3">
            <h3 className="text-amber-300 text-xs font-semibold mb-1">Detected Coverage Gaps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This module should be improved with: {coverageGaps.join(', ')}. Do not treat the topic as complete until those are added.
            </p>
          </div>
        )}

        <details className="border border-slate-800 rounded-xl p-3 bg-slate-950/50">
          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
            Commands You Will Run Locally ({runnableCommands.length})
          </summary>
          {runnableCommands.length > 0 ? (
            <div className="mt-3 space-y-2">
              {mod.labSteps.filter((step) => step.command).map((step) => (
                <div key={step.id} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-900 px-3 py-2 text-[11px] text-slate-400">
                    {step.title}
                  </div>
                  <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed text-cyan-200 font-mono">
                    {step.command}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No local commands are defined yet.</p>
          )}
        </details>

        <details className="mt-3 border border-slate-800 rounded-xl p-3 bg-slate-950/50" open>
          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
            Exercises To Run On Your Computer ({exerciseTasks.length})
          </summary>
          <div className="mt-3 space-y-3">
            {exerciseTasks.map((task) => (
              <div key={task.id} className="border border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-900 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{task.title}</div>
                      <div className="text-[11px] text-slate-500">{task.goal}</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-cyan-300 border border-cyan-500/20 rounded-full px-2 py-1">
                      {task.kind}
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-0">
                  <div className="p-3 border-b md:border-b-0 md:border-r border-slate-800">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Run</div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-cyan-200 font-mono whitespace-pre-wrap">
                      {task.commands.join('\n')}
                    </pre>
                  </div>
                  <div className="p-3 border-b md:border-b-0 md:border-r border-slate-800">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Verify</div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-200 font-mono whitespace-pre-wrap">
                      {task.verify.join('\n')}
                    </pre>
                    <p className="text-[11px] text-slate-500 mt-2">{task.expectedOutcome}</p>
                  </div>
                  <div className="p-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Cleanup</div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-amber-200 font-mono whitespace-pre-wrap">
                      {task.cleanup.join('\n')}
                    </pre>
                  </div>
                </div>
                {task.sourceRefs && task.sourceRefs.length > 0 && (
                  <div className="px-3 pb-3 border-t border-slate-800 pt-2">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Official Docs</div>
                    <div className="flex flex-wrap gap-2">
                      {task.sourceRefs.map((ref) => (
                        <a
                          key={ref.url}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        >
                          {ref.title}
                          <span className="text-slate-600 no-underline ml-1">({ref.scope})</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
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

              <LearningContract phaseSlug={phaseSlug} mod={mod} />

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
