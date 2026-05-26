import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Glitch-style 404 */}
        <div className="relative mb-6">
          <div className="text-8xl font-bold text-slate-800 font-mono select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-8xl font-bold font-mono bg-clip-text text-transparent select-none"
              style={{ backgroundImage: 'linear-gradient(135deg, #326CE5, #60a5fa)' }}
            >
              404
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-100 mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Looks like this Pod got evicted. The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/learn"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            Go to Course →
          </Link>
          <Link
            href="/"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm border border-slate-700"
          >
            Home
          </Link>
        </div>

        {/* Fun kubectl hint */}
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-lg p-3 text-left font-mono text-xs">
          <div className="text-slate-500 mb-1">$ kubectl get page --namespace=k8s-course</div>
          <div className="text-red-400">Error: page &quot;not-found&quot; not found</div>
          <div className="text-slate-600 mt-1">hint: try &apos;kubectl get modules&apos; instead</div>
        </div>
      </div>
    </main>
  )
}
