import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useStudio } from '../../state/studio'
import type { ConsoleEntry } from '../../types/nano'

const PANELS = [
  { id: 'problems', label: 'Problems', icon: '⚠️' },
  { id: 'output', label: 'Output', icon: '📤' },
  { id: 'terminal', label: 'Terminal', icon: '💻' },
  { id: 'serial', label: 'Serial Monitor', icon: '📡' },
]

export function BottomPanel() {
  const [activePanel, setActivePanel] = useState<string>('problems')
  const [isOpen, setIsOpen] = useState(true)
  const [height, setHeight] = useState(240)

  const entries: ConsoleEntry[] = []

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = height

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY
      setHeight(Math.max(120, Math.min(600, startHeight + deltaY)))
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <motion.div
      className={`fixed bottom-[28px] left-[56px] right-0 z-30 bg-ink-panel border-t border-ink-line transition-all duration-200 ${
        isOpen ? 'h-[240px]' : 'h-8'
      }`}
      style={{ height: isOpen ? height : 28, minHeight: isOpen ? height : 28 }}
      initial={false}
      animate={{ height: isOpen ? height : 28 }}
    >
      <div
        className="w-full h-8 bg-ink-deep border-b border-ink-line flex items-center gap-1 px-2 cursor-row-resize select-none"
        onMouseDown={handleDragStart}
        onDoubleClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-label={isOpen ? 'Collapse bottom panel' : 'Expand bottom panel'}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1">
          {PANELS.map((panel) => (
            <motion.button
              key={panel.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-micro text-sm font-medium ${
                activePanel === panel.id
                  ? 'bg-ink-raised text-spark border-b-2 border-spark'
                  : 'text-nsGray-medium hover:text-nsWhite hover:bg-ink-raised'
              }`}
              onClick={() => setActivePanel(panel.id)}
              whileTap={{ scale: 0.98 }}
            >
              <span aria-hidden>{panel.icon}</span> {panel.label}
            </motion.button>
          ))}
        </div>

        <div className="flex-1" />

        <motion.button
          className={`p-1.5 rounded transition-micro text-nsGray-medium hover:text-nsWhite hover:bg-ink-raised ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.9 }}
          aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={activePanel}
            className="flex-1 overflow-auto p-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 150 }}
          >
            {activePanel === 'problems' && <ProblemsPanel />}
            {activePanel === 'output' && <OutputPanel />}
            {activePanel === 'terminal' && <TerminalPanel />}
            {activePanel === 'serial' && <SerialPanel entries={entries} />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ProblemsPanel() {
  const studio = useStudio()
  const project = studio.activeProject

  if (!project) return <EmptyState message="Open a project to see problems" />

  const issues: Array<{ msg: string; severity: 'err' | 'warn' | 'info' }> = [
    ...(project.circuit.components.length < 2 ? [{ msg: 'Add components to your circuit', severity: 'info' as const }] : []),
    ...(project.blocks.loop.length === 0 ? [{ msg: 'No blocks programmed yet', severity: 'info' as const }] : []),
  ]

  return (
    <div className="h-full overflow-auto font-mono text-sm">
      {issues.length === 0 ? (
        <motion.div className="h-full flex items-center justify-center text-nsGray-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-3xl mb-2">✅</span>
          <p>No problems detected</p>
        </motion.div>
      ) : (
        <ul className="space-y-2" role="list">
          {issues.map((issue, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`flex items-start gap-2 p-2 rounded-lg bg-ink-raised ${issue.severity === 'err' ? 'border-l-3 border-err' : issue.severity === 'warn' ? 'border-l-3 border-warn' : 'border-l-3 border-info'}`}>
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${issue.severity === 'err' ? 'bg-err' : issue.severity === 'warn' ? 'bg-warn' : 'bg-info'}`} />
                <span className="flex-1 text-nsWhite">{issue.msg}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OutputPanel() {
  return (
    <div className="h-full flex items-center justify-center text-nsGray-medium font-mono text-sm">
      <p>Build output will appear here</p>
    </div>
  )
}

function TerminalPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex items-center gap-2 text-xs text-nsGray-medium">
        <span>💻 Terminal</span>
        <span className="w-2 h-2 rounded-full bg-ok" />
        <span>bash</span>
      </div>
      <div className="flex-1 bg-ink-deep rounded-lg p-3 font-mono text-sm overflow-auto">
        <div className="flex items-center gap-2 text-nsGray-medium">
          <span>user@nano-spark</span>
          <span className="text-spark">:</span>
          <span className="text-info">~/workspace</span>
          <span className="text-spark">$</span>
        </div>
      </div>
    </div>
  )
}

interface SerialPanelProps {
  entries: ConsoleEntry[]
}

function SerialPanel({ entries }: SerialPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-nsGray-medium">📡 Serial Monitor</span>
        <motion.button className="text-xs px-2 py-1 rounded bg-ink-raised hover:bg-ink-line text-nsGray-medium hover:text-nsWhite transition-micro" whileTap={{ scale: 0.95 }}>
          Clear
        </motion.button>
      </div>
      <div className="flex-1 bg-ink-deep rounded-lg p-3 font-mono text-sm overflow-auto text-nsWhite">
        {entries.length === 0 ? (
          <p className="text-nsGray-medium">Waiting for serial data…</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={`mb-1 ${entry.level === 'error' ? 'text-err' : entry.level === 'warn' ? 'text-warn' : ''}`}>
              <span className="text-nsGray-medium mr-2">{entry.time}</span>
              <span className="text-xs uppercase text-nsGray-medium mr-2">{entry.level}</span>
              {entry.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-nsGray-medium">
      <p>{message}</p>
    </div>
  )
}