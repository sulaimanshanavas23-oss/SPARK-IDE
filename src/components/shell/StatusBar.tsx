import { motion } from 'framer-motion'
import { useStudio } from '../../state/studio'

export function StatusBar() {
  const studio = useStudio()

  return (
    <footer className="fixed bottom-0 left-[56px] right-0 z-50 h-[28px] bg-ink-deep border-t border-ink-line flex items-center gap-4 px-3 text-sm font-mono">
      <motion.span
        className={`flex items-center gap-1.5 px-2 py-1 rounded ${
          studio.saveState === 'saved'
            ? 'bg-ok/15 text-ok border border-ok/20'
            : studio.saveState === 'saving'
              ? 'bg-warn/15 text-warn border border-warn/20 animate-pulse'
              : 'bg-warn/15 text-warn border border-warn/20'
        }`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {studio.saveState === 'saved' ? 'Saved' : studio.saveState === 'saving' ? 'Saving…' : 'Unsaved'}
      </motion.span>

      <div className="flex-1 flex items-center justify-center gap-4 text-nsGray-medium">
        <motion.span className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          Arduino UNO
        </motion.span>

        <motion.span className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
          index.ino
        </motion.span>

        <motion.span className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Ln 1, Col 1
        </motion.span>

        <motion.span className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          C++
        </motion.span>
      </div>

      <div className="flex items-center gap-2">
        <motion.span className="flex items-center gap-1.5 px-2 py-1 rounded bg-ink-raised text-nsWhite font-semibold" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run
        </motion.span>

        <motion.button
          className="p-1.5 rounded hover:bg-ink-raised text-nsGray-medium hover:text-nsWhite transition-micro"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1 1.51z" />
          </svg>
        </motion.button>
      </div>
    </footer>
  )
}