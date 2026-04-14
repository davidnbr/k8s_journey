import { phases } from '@/content/index'
import LessonPageClient from './LessonPageClient'

export function generateStaticParams() {
  return phases.flatMap((phase) =>
    phase.modules.map((mod) => ({
      phase: phase.slug,
      module: mod.slug,
    }))
  )
}

interface PageProps {
  params: Promise<{ phase: string; module: string }>
}

export default function LessonPage({ params }: PageProps) {
  return <LessonPageClient params={params} />
}
