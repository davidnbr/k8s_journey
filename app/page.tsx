import Link from 'next/link'
import { phases } from '@/content/index'

export default function HomePage() {
  const totalModules = phases.reduce((a, p) => a + p.modules.length, 0)
  const totalHours = '~170'

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
            Kubernetes v1.33 · Updated March 2026
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Learn Kubernetes{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #326CE5, #60a5fa)' }}
            >
              Zero to Advanced
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Interactive labs with a live cluster diagram. Scripted walkthroughs, animated
            diagrams, and active recall quizzes — designed around how your brain actually learns.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <Link
              href="/learn"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Start Learning →
            </Link>
            <Link
              href="/learn/phase-1/pods"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl transition-colors text-sm border border-slate-700"
            >
              Jump to Pods Lab
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">{phases.length}</span> phases
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">{totalModules}</span> interactive modules
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">{totalHours}h</span> total content
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">Free</span> no account needed
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-bold text-slate-100 mb-2 text-center">How Each Lesson Works</h2>
        <p className="text-slate-500 text-sm text-center mb-10">
          Built on spaced repetition, active recall, and dual coding — the three most evidence-based learning techniques.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📖', step: '1', title: 'Read Theory', desc: 'Concept + ASCII architecture diagram' },
            { icon: '▶', step: '2', title: 'Run the Lab', desc: 'Step-by-step scripted terminal walkthrough' },
            { icon: '🎨', step: '3', title: 'Watch the Diagram', desc: 'Cluster state animates as you run commands' },
            { icon: '🧠', step: '4', title: 'Active Recall Quiz', desc: 'Test yourself before the answers are shown' },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center hover:border-slate-600 transition-colors"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                Step {item.step}
              </div>
              <div className="text-slate-200 text-sm font-semibold mb-1">{item.title}</div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Phases overview */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold text-slate-100 mb-8 text-center">Course Phases</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {phases.map((phase) => (
            <Link
              key={phase.id}
              href={`/learn/${phase.slug}/${phase.modules[0].slug}`}
              className={`group bg-slate-900 border rounded-xl p-5 hover:border-slate-500 transition-all ${phase.bgColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${phase.color}`}>
                    {phase.weeks}
                  </div>
                  <h3 className="text-slate-100 font-bold text-base">{phase.title}</h3>
                </div>
                <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded">
                  {phase.hours}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">{phase.description}</p>
              <div className="flex flex-wrap gap-1">
                {phase.modules.map((m) => (
                  <span
                    key={m.id}
                    className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700"
                  >
                    {m.title}
                  </span>
                ))}
              </div>
            </Link>
          ))}

          {/* Placeholder phases */}
          {['Config & Storage', 'Networking', 'Operations & Security', 'Advanced'].map((title) => (
            <div
              key={title}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 opacity-40 cursor-not-allowed"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">Coming soon</div>
              <h3 className="text-slate-500 font-bold text-base">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        Sources: kubernetes.io · cncf.io · Kubernetes v1.33 (Octarine) · March 2026
      </footer>
    </main>
  )
}
