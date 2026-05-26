'use client'

import { useState } from 'react'
import Link from 'next/link'
import { phases } from '@/content/index'

export default function LearnOverviewPage() {
  const [search, setSearch] = useState('')
  const query = search.toLowerCase().trim()

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

      {/* Learning system reminder — hide when searching */}
      {!query && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-8">
          <h2 className="text-blue-300 text-sm font-semibold mb-2">The Learning Loop (for every module)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              ['1. Preview', 'Glance at the diagram (30s)'],
              ['2. Read Theory', 'Concept + visual explanation'],
              ['3. Run the Lab', 'Step-by-step terminal walkthrough'],
              ['4. Quiz Yourself', 'Active recall before the answers'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-blue-500/5 rounded-lg p-2">
                <div className="text-blue-400 font-semibold mb-0.5">{title}</div>
                <div className="text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
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
        {filteredPhases.map((phase, pi) => {
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
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
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
