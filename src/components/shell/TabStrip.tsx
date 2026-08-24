import { motion } from 'framer-motion'
import { useStudio } from '../../state/studio'
import type { NanoProject } from '../../types/nano'

interface TabStripProps {
  project: NanoProject | null
}

export function TabStrip({ project }: TabStripProps) {
  const studio = useStudio()

  if (!project) return null

  return (
    <div className="flex items-center h-[40px] bg-ink-panel border-b border-ink-line px-3 relative overflow-x-auto">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-raised text-nsWhite text-sm font-medium min-w-[180px] max-w-[260px] flex-shrink-0">
          <span aria-hidden>📄</span>
          <span className="truncate">{project.name}</span>
        </span>

        <motion.span
          className={`px-2 py-0.5 rounded text-xs font-mono ${
            project.code.syncedFromBlocks
              ? 'bg-ok/15 text-ok border border-ok/20'
              : 'bg-warn/15 text-warn border border-warn/20'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {project.code.syncedFromBlocks ? '● Synced' : '✎ Modified'}
        </motion.span>
      </motion.div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 pr-2">
        <motion.button
          className="px-3 py-1.5 rounded-lg bg-spark text-ink-deep font-semibold text-sm hover:bg-spark-dark shadow-glow transition-micro flex items-center gap-1.5"
          onClick={() => studio.openWorkspace(project.id, 'simulate')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run
        </motion.button>

        <motion.button
          className="p-1.5 rounded hover:bg-ink-raised text-nsGray-medium hover:text-nsWhite transition-micro"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1 1.51z" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}