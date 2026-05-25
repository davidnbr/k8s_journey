import Link from 'next/link'
import { phases } from '@/content/index'

export default function LearnOverviewPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Course Overview</h1>
        <p className="text-slate-400 text-sm">
          Follow the phases in order. Each module builds on the previous. Use the sidebar to track your progress.
        </p>
      </div>

      {/* Learning system reminder */}
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

      {/* Phases */}
      <div className="space-y-8">
        {phases.map((phase, pi) => (
          <div key={phase.id}>
            {/* Phase header */}
            <div className={`border rounded-xl p-4 mb-3 ${phase.bgColor}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${phase.color}`}>
                    Phase {pi} · {phase.weeks}
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
              {phase.modules.map((mod, mi) => (
                <Link
                  key={mod.id}
                  href={`/learn/${phase.slug}/${mod.slug}`}
                  className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs font-mono">
                        {pi}.{mi + 1}
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
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
