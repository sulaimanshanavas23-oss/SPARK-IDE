import { motion } from 'framer-motion'
import { useStudio } from '../../state/studio'

export function Breadcrumbs() {
  const studio = useStudio()
  const project = studio.activeProject

  if (!project) return null

  return (
    <nav className="h-[32px] bg-nsGray-light border-b border-border px-3 flex items-center gap-1.5 text-sm text-nsGray-medium" aria-label="Breadcrumb">
      <motion.button
        className="flex items-center gap-1 px-2 py-1 rounded bg-nsGray-medium/50 hover:text-nsWhite hover:bg-nsGray-light transition-colors"
        onClick={() => studio.navigate('dashboard')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span aria-hidden>🏠</span>
      </motion.button>

      <span className="text-nsGray-medium mx-1">/</span>

      <motion.button
        className="flex items-center gap-1 px-2 py-1 rounded bg-nsGray-medium/50 hover:text-nsWhite hover:bg-nsGray-light transition-colors"
        onClick={() => studio.navigate('projects')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span aria-hidden>📁</span> Projects
      </motion.button>

      <span className="text-nsGray-medium mx-1">/</span>

      <motion.span
        className="flex items-center gap-1 px-2 py-1 text-nsWhite font-medium truncate max-w-[200px]"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span aria-hidden>📄</span> {project.name}
      </motion.span>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <motion.span
          className="px-2 py-0.5 rounded text-xs font-mono bg-nsGray-light/15 text-nsGray-medium border border-nsGray-medium/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {project.code.syncedFromBlocks ? '● Synced' : '✎ Modified'}
        </motion.span>

        <motion.button
          className="px-3 py-1.5 rounded-lg bg-nsYellow text-nsBlack font-semibold text-sm hover:bg-nsYellow-dark shadow-colors transition-200 flex items-center gap-1.5"
          onClick={() => studio.openWorkspace(project.id, 'simulate')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run
        </motion.button>
      </div>
    </nav>
  )
}