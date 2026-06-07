'use client'

import { useState, useEffect } from 'react'
import type { QuizQuestion } from '@/lib/types'

interface Props {
  questions: QuizQuestion[]
  onComplete: () => void
}

export default function QuizCard({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<
    { question: string; correct: string; explanation: string }[]
  >([])

  const q = questions[current]
  const isCorrect = selected === q.answer

  const handleSelect = (i: number) => {
    if (revealed) return
    setSelected(i)
  }

  const handleReveal = () => {
    if (selected === null) return
    setRevealed(true)
    if (selected === q.answer) {
      setScore((s) => s + 1)
    } else {
      setWrongAnswers((w) => [
        ...w,
        { question: q.question, correct: q.options[q.answer], explanation: q.explanation },
      ])
    }
  }

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setFinished(true)
      onComplete()
    }
  }

  // Keyboard shortcuts: A-D or 1-4 to select, Enter to confirm/advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finished) return
      // Don't fire if user is typing in an input elsewhere
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const keyIndex =
        ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase()) !== -1
          ? ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase())
          : ['1', '2', '3', '4'].indexOf(e.key)
      if (keyIndex >= 0 && keyIndex < q.options.length && !revealed) {
        handleSelect(keyIndex)
        return
      }
      if (e.key === 'Enter') {
        if (!revealed && selected !== null) handleReveal()
        else if (revealed) handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [finished, revealed, selected, current, q])

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 animate-fade-in text-center">
        <div className="text-4xl mb-3">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
        <h3 className="text-lg font-bold text-slate-100 mb-1">Quiz Complete!</h3>
        <p className="text-slate-400 text-sm mb-4">
          You scored{' '}
          <span
            className={`font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}
          >
            {score}/{questions.length}
          </span>{' '}
          ({pct}%)
        </p>
        {wrongAnswers.length > 0 ? (
          <div className="mt-4 text-left space-y-3">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
              Review these:
            </p>
            {wrongAnswers.map((wa, i) => (
              <div
                key={i}
                className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-left"
              >
                <p className="text-slate-300 text-xs font-medium mb-1">{wa.question}</p>
                <p className="text-emerald-400 text-xs mb-1">✓ {wa.correct}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{wa.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-xs">Perfect score — no items to review.</p>
        )}
        <button
          onClick={() => {
            setCurrent(0)
            setSelected(null)
            setRevealed(false)
            setScore(0)
            setFinished(false)
            setWrongAnswers([])
          }}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline"
        >
          Retake quiz
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Active Recall
          </span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
            {current + 1} / {questions.length}
          </span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < current ? 'bg-emerald-500' : i === current ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-600 mt-1 px-4 pb-2">
        Press <kbd className="bg-slate-800 px-1 rounded text-slate-400">A–D</kbd> to select ·{' '}
        <kbd className="bg-slate-800 px-1 rounded text-slate-400">Enter</kbd> to confirm
      </p>

      {/* Question */}
      <div className="p-4">
        <p className="text-slate-100 text-sm font-medium leading-relaxed mb-4">{q.question}</p>

        {/* Options */}
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let cls =
              'w-full text-left border rounded-lg px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer '
            if (!revealed) {
              cls +=
                selected === i
                  ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                  : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
            } else {
              if (i === q.answer) {
                cls += 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
              } else if (selected === i && i !== q.answer) {
                cls += 'border-red-500 bg-red-500/10 text-red-200'
              } else {
                cls += 'border-slate-800 bg-slate-900/40 text-slate-500 cursor-default'
              }
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)}>
                <div className="flex items-start gap-2">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded border text-[11px] flex items-center justify-center mt-0.5 font-mono transition-all ${
                      revealed
                        ? i === q.answer
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/20'
                          : selected === i
                            ? 'border-red-500 text-red-400'
                            : 'border-slate-700 text-slate-600'
                        : selected === i
                          ? 'border-blue-500 text-blue-400 bg-blue-500/20'
                          : 'border-slate-600 text-slate-500'
                    }`}
                  >
                    {revealed
                      ? i === q.answer
                        ? '✓'
                        : selected === i
                          ? '✗'
                          : String.fromCharCode(65 + i)
                      : String.fromCharCode(65 + i)}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div
            className={`mt-4 rounded-lg p-3 border animate-slide-up ${
              isCorrect
                ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200'
                : 'bg-red-500/5 border-red-500/30 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{isCorrect ? '✓' : '✗'}</span>
              <span className="text-xs font-semibold">{isCorrect ? 'Correct!' : 'Not quite'}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end px-4 py-3 border-t border-slate-800">
        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={selected === null}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              selected !== null
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
          >
            {current < questions.length - 1 ? 'Next Question →' : 'Finish Quiz ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
