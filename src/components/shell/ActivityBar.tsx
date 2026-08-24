import { motion, AnimatePresence } from 'framer-motion'
import { useStudio } from '../../state/studio'
import type { WorkspaceTab } from '../../state/studio'

const WORKSPACE_TABS: Array<{ id: WorkspaceTab; label: string; icon: string; shortcut?: string }> = [
  { id: 'design', label: 'Design', icon: '🔌', shortcut: '1' },
  { id: 'logic', label: 'Logic', icon: '🧩', shortcut: '2' },
  { id: 'blocks', label: 'Blocks', icon: '🧱', shortcut: '3' },
  { id: 'code', label: 'Code', icon: '⌨️', shortcut: '4' },
  { id: 'simulate', label: 'Simulate', icon: '▶️', shortcut: '5' },
  { id: 'test', label: 'Test', icon: '🧪', shortcut: '6' },
  { id: 'deploy', label: 'Deploy', icon: '🚀', shortcut: '7' },
]

export function ActivityBar() {
  const studio = useStudio()
  const inWorkspace = studio.view.page === 'workspace' && studio.activeProject

  return (
    <aside
      className={`fixed top-[48px] left-0 bottom-[28px] z-40 w-14 bg-nsBlack border-r border-border flex flex-col items-center transition-280`}
      role="navigation"
      aria-label="Workspace tabs"
    >
      <div className="flex-1 flex flex-col items-center gap-1 pt-3 pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {WORKSPACE_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              className={`relative w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                inWorkspace && studio.view.tab === tab.id
                  ? 'bg-nsGray-light text-nsBlack'
                  : inWorkspace
                    ? 'text-nsGray-medium hover:text-nsWhite hover:bg-nsGray-light'
                    : 'text-nsGray-medium/50 hover:text-nsGray-medium'}
              }`}
              disabled={!inWorkspace}
              onClick={() => inWorkspace && studio.setTab(tab.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 150, delay: 0.03 }}
              title={inWorkspace ? `${tab.label} (${tab.shortcut})` : `Open a project to use ${tab.label}`}
            >
              <span className="text-xl text-nsYellow" aria-hidden={true}>{tab.icon}</span>
              <span className="text-[10px] font-mono text-nsGray-medium">{tab.shortcut}</span>
              {inWorkspace && studio.view.tab === tab.id && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-nsYellow shadow-glow"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0 }}
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full px-2 pb-2 border-t border-border">
        <motion.button
          className="w-full h-9 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-nsGray-medium hover:text-nsWhite hover:bg-nsGray-light transition-200"
          disabled={!inWorkspace}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <span aria-hidden>⚙️</span> Settings
        </motion.button>
      </div>
    </aside>
  )
}