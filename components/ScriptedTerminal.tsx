'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LabStep, ClusterState } from '@/lib/types'

interface Props {
  steps: LabStep[]
  onStateChange: (state: ClusterState) => void
  onComplete: () => void
}

type StepPhase = 'ready' | 'typing' | 'output' | 'done'

export default function ScriptedTerminal({ steps, onStateChange, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [phase, setPhase] = useState<StepPhase>('ready')
  const [typedCmd, setTypedCmd] = useState('')
  const [visibleLines, setVisibleLines] = useState(0)
  const [history, setHistory] = useState<{ cmd: string; output: string[] }[]>([])
  const [challengeMode, setChallengeMode] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history, typedCmd, visibleLines])

  // Reset user input when step changes
  useEffect(() => {
    setUserInput('')
    setInputError(false)
  }, [currentStep])

  // Auto-focus input when entering challenge mode or advancing
  useEffect(() => {
    if (challengeMode && phase === 'ready' && step.command) {
      inputRef.current?.focus()
    }
  }, [challengeMode, phase, currentStep, step.command])

  // Clear inputError after 600ms
  useEffect(() => {
    if (!inputError) return
    const t = setTimeout(() => setInputError(false), 600)
    return () => clearTimeout(t)
  }, [inputError])

  const runCommand = useCallback(() => {
    if (phase !== 'ready') return
    if (!step.command) {
      onStateChange(step.clusterState)
      setPhase('done')
      return
    }

    setPhase('typing')
    setTypedCmd('')
    let i = 0
    const cmd = step.command

    const typeNext = () => {
      i++
      setTypedCmd(cmd.slice(0, i))
      if (i < cmd.length) {
        setTimeout(typeNext, 28 + Math.random() * 18)
      } else {
        setTimeout(() => {
          setPhase('output')
          setVisibleLines(0)
          onStateChange(step.clusterState)
        }, 300)
      }
    }
    setTimeout(typeNext, 150)
  }, [phase, step, onStateChange])

  const handleChallengeSubmit = useCallback(() => {
    if (userInput.trim() === step.command?.trim()) {
      setUserInput('')
      runCommand()
    } else {
      setInputError(true)
    }
  }, [userInput, step.command, runCommand])

  // Animate output lines one by one
  useEffect(() => {
    if (phase !== 'output') return
    const output = step.output ?? []
    if (visibleLines < output.length) {
      const t = setTimeout(() => setVisibleLines((v) => v + 1), 80)
      return () => clearTimeout(t)
    } else {
      setPhase('done')
    }
  }, [phase, visibleLines, step])

  const advance = useCallback(() => {
    if (phase !== 'done') return
    if (step.command) {
      setHistory((h) => [...h, { cmd: step.command!, output: step.output ?? [] }])
    }
    setTypedCmd('')
    setVisibleLines(0)
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep((s) => s + 1)
      setPhase('ready')
    }
  }, [phase, step, isLastStep, onComplete])

  const reset = useCallback(() => {
    setCurrentStep(0)
    setPhase('ready')
    setTypedCmd('')
    setVisibleLines(0)
    setHistory([])
    onStateChange(steps[0].clusterState)
  }, [steps, onStateChange])

  const outputLines = step.output ?? []

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700">
      {/* Step progress bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
        <span className="text-slate-400 text-xs">Lab</span>
        <div
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Step ${currentStep + 1} of ${steps.length}`}
          className="flex gap-1 flex-1"
        >
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < currentStep ? 'bg-emerald-500' : i === currentStep ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <span className="text-slate-500 text-xs font-mono">
          {currentStep + 1}/{steps.length}
        </span>
        <button
          onClick={() => { setChallengeMode(m => !m); setUserInput(''); setInputError(false) }}
          aria-pressed={challengeMode}
          className={`text-[10px] px-2 py-1 rounded border transition-all ${
            challengeMode
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
        >
          {challengeMode ? '⌨ Challenge' : '▶ Guided'}
        </button>
      </div>

      {/* Current step instruction */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800">
        <div className="flex items-start gap-2">
          <span className="text-blue-400 text-xs font-bold mt-0.5 flex-shrink-0">
            Step {currentStep + 1}
          </span>
          <div>
            <p className="text-slate-100 text-sm font-semibold">{step.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{step.instruction}</p>
          </div>
        </div>

        {/* YAML display */}
        {step.yamlContent && (
          <div className="mt-3 bg-slate-950 rounded-lg border border-slate-700 p-3 overflow-x-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500">pod.yaml</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">YAML</span>
            </div>
            <pre className="text-xs font-mono text-slate-200 leading-[1.2]">
              {step.yamlContent.split('\n').map((line, i) => {
                const isKey = /^(\s*)([\w-]+):/.test(line) && !line.trimStart().startsWith('-')
                const isComment = line.trimStart().startsWith('#')
                const isString = line.includes(': "') || line.includes(": '")
                return (
                  <div key={i}>
                    {isComment ? (
                      <span className="text-slate-500">{line}</span>
                    ) : isKey ? (
                      <span>
                        <span className="text-blue-300">{line.match(/^(\s*[\w-]+)/)?.[0]}</span>
                        <span className="text-slate-400">:</span>
                        <span className={isString ? 'text-emerald-300' : 'text-slate-200'}>
                          {line.slice((line.match(/^(\s*[\w-]+)/)?.[0].length ?? 0) + 1)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-200">{line}</span>
                    )}
                  </div>
                )
              })}
            </pre>
          </div>
        )}
      </div>

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 min-h-0">
        {/* History */}
        {history.map((h, hi) => (
          <div key={hi} className="space-y-0.5 opacity-50">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 select-none">$</span>
              <span className="text-slate-200">{h.cmd}</span>
            </div>
            {h.output.map((line, li) => (
              <div key={li} className="text-slate-400 pl-4 text-xs leading-5">{line}</div>
            ))}
          </div>
        ))}

        {/* Current command typing */}
        {(phase === 'typing' || phase === 'output' || phase === 'done') && step.command && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 select-none">$</span>
              <span className="text-slate-100">
                {typedCmd}
                {phase === 'typing' && <span className="animate-blink text-emerald-400">▌</span>}
              </span>
            </div>
            {(phase === 'output' || phase === 'done') &&
              outputLines.slice(0, visibleLines).map((line, i) => (
                <div
                  key={i}
                  className={`pl-4 text-xs leading-5 animate-slide-up ${
                    line === '' ? 'h-2' : 'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              ))}
          </div>
        )}

        {/* Idle prompt / challenge input */}
        {phase === 'ready' && step.command && (
          challengeMode ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 select-none" aria-hidden="true">$</span>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleChallengeSubmit() }}
                aria-label="Enter kubectl command"
                className={`bg-transparent font-mono text-sm outline-none flex-1 ml-2 ${
                  inputError ? 'text-red-400' : 'text-slate-100'
                }`}
                placeholder="type the command…"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600" aria-hidden="true">
              <span className="text-emerald-700 select-none">$</span>
              <span className="animate-blink text-slate-700">▌</span>
            </div>
          )
        )}
      </div>

      {/* Explanation & tip */}
      {phase === 'done' && (
        <div className="border-t border-slate-700 px-4 py-3 bg-slate-900/40 animate-slide-up">
          <p className="text-slate-300 text-xs leading-relaxed">{step.explanation}</p>
          {step.tip && (
            <div className="mt-2 flex items-start gap-2">
              <span className="text-yellow-400 text-xs" aria-hidden="true">💡</span>
              <p className="text-yellow-300/80 text-xs leading-relaxed">{step.tip}</p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-700">
        <button
          onClick={reset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ↺ Reset lab
        </button>

        <div className="flex gap-2">
          {phase === 'ready' && challengeMode && step.command && (
            <>
              <button
                onClick={runCommand}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                Run for me
              </button>
              <button
                onClick={handleChallengeSubmit}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Run ↵
              </button>
            </>
          )}

          {phase === 'ready' && !challengeMode && (
            <button
              onClick={runCommand}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <span aria-hidden="true">▶</span>
              {step.command ? 'Run Command' : 'Apply YAML'}
            </button>
          )}

          {phase === 'ready' && challengeMode && !step.command && (
            <button
              onClick={runCommand}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <span aria-hidden="true">▶</span>
              Apply YAML
            </button>
          )}

          {phase === 'typing' && (
            <button
              disabled
              aria-busy="true"
              className="flex items-center gap-2 bg-slate-700 text-slate-400 text-xs px-4 py-2 rounded-lg cursor-not-allowed"
            >
              <span className="animate-spin inline-block" aria-hidden="true">⟳</span> Running…
            </button>
          )}

          {phase === 'output' && (
            <button
              disabled
              aria-busy="true"
              className="flex items-center gap-2 bg-slate-700 text-slate-400 text-xs px-4 py-2 rounded-lg cursor-not-allowed"
            >
              Loading output…
            </button>
          )}

          {phase === 'done' && (
            <button
              onClick={advance}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                isLastStep
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              }`}
            >
              {isLastStep ? '✓ Complete Lab' : 'Next Step →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
