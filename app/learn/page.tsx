'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { phases } from '@/content/index'
import { getPhaseLearningRole, learningPrinciples } from '@/content/learningDesign'
import { getDueReviews, getUpcomingReviews, REVIEW_INTERVALS, type DueReview } from '@/lib/progress'

export default function LearnOverviewPage() {
  const [search, setSearch] = useState('')
  const [dueReviews, setDueReviews] = useState<DueReview[]>([])
  const [upcomingReviews, setUpcomingReviews] = useState<DueReview[]>([])
  const query = search.toLowerCase().trim()

  useEffect(() => {
    function load() {
      setDueReviews(getDueReviews(phases))
      setUpcomingReviews(getUpcomingReviews(phases, 3))
    }
    load()
    window.addEventListener('k8s-progress-change', load)
    return () => window.removeEventListener('k8s-progress-change', load)
  }, [])

  const filteredPhases = query
    ? phases
        .map((phase) => ({
          ...phase,
          modules: phase.modules.filter(
            (mod) =>
              mod.title.toLowerCase().includes(query) ||
              mod.description.toLowerCase().includes(query) ||
              mod.slug.includes(query)
          ),
        }))
        .filter((phase) => phase.modules.length > 0)
    : phases

  const totalModules = phases.reduce((a, p) => a + p.modules.length, 0)
  const totalLabs = phases.reduce((a, p) => a + p.modules.reduce((b, m) => b + m.labSteps.length, 0), 0)
  const totalQuizzes = phases.reduce((a, p) => a + p.modules.reduce((b, m) => b + m.quiz.length, 0), 0)
  return (
    <div id="main-content" className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Course Overview</h1>
        <p className="text-slate-400 text-sm">
          {phases.length} phases · {totalModules} modules · {totalLabs} lab steps · {totalQuizzes} quiz questions
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3.5 3.5" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search modules... (e.g. pods, rbac, ingress)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
          aria-label="Search modules"
          id="module-search"
        />
        {query && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Due reviews — only show when not searching and there are due/upcoming */}
      {!query && (dueReviews.length > 0 || upcomingReviews.length > 0) && (
        <div className="mb-6">
          {dueReviews.length > 0 && (
            <div className="bg-amber-500/8 border border-amber-500/30 rounded-xl p-4 mb-3">
              <h2 className="text-amber-300 text-sm font-semibold mb-3 flex items-center gap-2">
                <span>⏰</span>
                {dueReviews.length} module{dueReviews.length !== 1 ? 's' : ''} due for review
              </h2>
              <div className="space-y-2">
                {dueReviews.map((r) => (
                  <Link
                    key={`${r.phaseSlug}-${r.moduleSlug}`}
                    href={`/learn/${r.phaseSlug}/${r.moduleSlug}`}
                    className="flex items-center justify-between bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 transition-all group"
                  >
                    <div>
                      <span className="text-amber-400/60 text-[10px] uppercase tracking-wide mr-2">{r.phaseTitle}</span>
                      <span className="text-slate-200 text-sm group-hover:text-white">{r.moduleTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-400/80">
                        Day {REVIEW_INTERVALS[r.intervalIndex]} review
                      </span>
                      {r.overdueDays > 0 && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                          {r.overdueDays}d overdue
                        </span>
                      )}
                      {r.overdueDays === 0 && (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
                          due today
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {upcomingReviews.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Upcoming reviews (next 3 days)</h2>
              <div className="flex flex-wrap gap-2">
                {upcomingReviews.map((r) => {
                  const daysUntil = Math.ceil((r.dueAt - Date.now()) / 86_400_000)
                  return (
                    <Link
                      key={`${r.phaseSlug}-${r.moduleSlug}`}
                      href={`/learn/${r.phaseSlug}/${r.moduleSlug}`}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 transition-all"
                    >
                      {r.moduleTitle}
                      <span className="text-slate-500 ml-1.5">in {daysUntil}d</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning system reminder — hide when searching */}
      {!query && (
        <details className="mb-8">
          <summary className="text-slate-400 text-sm cursor-pointer mb-4 select-none">How this course works</summary>
        <div className="space-y-4">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <h2 className="text-blue-300 text-sm font-semibold mb-2">The Learning Loop (inside every module)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                ['1. Preview', 'Load the mental model before details'],
                ['2. Predict', 'Guess the state change before commands'],
                ['3. Run + Explain', 'Use the lab and diagram together'],
                ['4. Recall + Transfer', 'Quiz, then solve a small variant'],
              ].map(([title, desc]) => (
                <div key={title} className="bg-blue-500/5 rounded-lg p-2">
                  <div className="text-blue-400 font-semibold mb-0.5">{title}</div>
                  <div className="text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-slate-100 text-sm font-semibold mb-2">Science-backed constraints used to order the course</h2>
            <div className="grid md:grid-cols-2 gap-2">
              {learningPrinciples.map((principle) => (
                <div key={principle.name} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                  <div className="text-slate-200 text-xs font-semibold mb-1">{principle.name}</div>
                  <div className="text-slate-500 text-xs leading-relaxed">{principle.courseUse}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h2 className="text-amber-300 text-sm font-semibold mb-2">How to know you should move on</h2>
            <div className="grid md:grid-cols-3 gap-2 text-xs">
            {[
              ['Explain', 'You can describe the object and controller behavior without notes.'],
              ['Operate', 'You can run the lab path from a blank terminal.'],
              ['Debug', 'You can break one thing and identify the failing object or field.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-amber-500/5 rounded-lg p-2">
                <div className="text-amber-400 font-semibold mb-0.5">{title}</div>
                <div className="text-slate-400">{desc}</div>
              </div>
            ))}
            </div>
          </div>
        </div>
        </details>
      )}

      {/* Search results count */}
      {query && (
        <div className="text-slate-400 text-xs mb-4">
          {filteredPhases.reduce((a, p) => a + p.modules.length, 0)} module{filteredPhases.reduce((a, p) => a + p.modules.length, 0) !== 1 ? 's' : ''} found
          {filteredPhases.length > 0 && ` across ${filteredPhases.length} phase${filteredPhases.length !== 1 ? 's' : ''}`}
        </div>
      )}

      {/* Phases */}
      <div className="space-y-8">
        {filteredPhases.map((phase) => {
          const originalIndex = phases.findIndex((p) => p.id === phase.id)
          return (
            <div key={phase.id}>
              {/* Phase header */}
              <div className={`border rounded-xl p-4 mb-3 ${phase.bgColor}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${phase.color}`}>
                      Phase {originalIndex} · {phase.weeks}
                    </div>
                    <h2 className="text-slate-100 font-bold text-lg">{phase.title}</h2>
                    <p className="text-slate-400 text-xs mt-1">{phase.description}</p>
                    {!query && (
                      <p className="text-slate-500 text-xs mt-2">
                        Learning role: {getPhaseLearningRole(phase, originalIndex)}
                      </p>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs bg-slate-900/60 border border-slate-700 px-2 py-1 rounded">
                    {phase.hours}
                  </span>
                </div>
              </div>

              {/* Modules grid */}
              <div className="grid md:grid-cols-2 gap-3 pl-2">
                {phase.modules.map((mod) => {
                  const modOriginalIndex = phases
                    .find((p) => p.id === phase.id)
                    ?.modules.findIndex((m) => m.id === mod.id) ?? 0
                  return (
                    <Link
                      key={mod.id}
                      href={`/learn/${phase.slug}/${mod.slug}`}
                      className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-all"
                      id={`module-${mod.slug}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-xs font-mono">
                            {originalIndex}.{modOriginalIndex + 1}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              mod.difficulty === 'beginner'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : mod.difficulty === 'intermediate'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {mod.difficulty}
                          </span>
                        </div>
                        <span className="text-slate-600 text-xs">{mod.duration}</span>
                      </div>
                      <h3 className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors mb-1">
                        {mod.title}
                      </h3>
                      <p className="text-slate-500 text-xs">{mod.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                        <span>▶ {mod.labSteps.length} lab steps</span>
                        <span>🧠 {mod.quiz.length} quiz questions</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* No results */}
        {query && filteredPhases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-slate-400 text-sm">No modules found matching &ldquo;{search}&rdquo;</p>
            <button
              onClick={() => setSearch('')}
              className="text-blue-400 hover:text-blue-300 text-xs mt-2 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
