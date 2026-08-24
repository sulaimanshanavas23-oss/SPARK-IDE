import { motion } from 'framer-motion'
import { useStudio } from '../../state/studio'
import type { Page } from '../../state/studio'

const NAV_ITEMS: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'projects', label: 'Projects', icon: '📁' },
]

export function TitleBar() {
  const studio = useStudio()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[48px] bg-ink-deep border-b border-ink-line flex items-center gap-4 px-4">
      <motion.button
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-ink-raised transition-micro"
        onClick={() => studio.navigate('dashboard')}
        whileTap={{ scale: 0.98 }}
        title="Nano Spark IDE"
      >
        <span className="w-8 h-8 rounded-full bg-gradient-radial from-spark-light via-spark to-spark-dark flex items-center justify-center shadow-glow">
          <span className="text-ink-deep font-display font-bold text-xl">⚡</span>
        </span>
        <span className="font-display font-bold text-h1 tracking-wide">
          Nano <span className="text-spark">Spark</span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-spark/20 text-spark border border-spark/30">
          IDE
        </span>
      </motion.button>

      <nav className="flex items-center gap-1 ml-2" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <motion.button
            key={item.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-micro ${
              studio.view.page === item.id
                ? 'bg-ink-raised text-spark'
                : 'text-nsGray-medium hover:text-nsWhite hover:bg-ink-raised'
            }`}
            onClick={() => studio.navigate(item.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span aria-hidden={true}>{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <motion.div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono ${
            studio.saveState === 'saved'
              ? 'bg-ok/15 text-ok border border-ok/20'
              : studio.saveState === 'saving'
                ? 'bg-warn/15 text-warn border border-warn/20 animate-pulse'
                : 'bg-warn/15 text-warn border border-warn/20'
          }`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 150 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {studio.saveState === 'saved' ? 'Saved' : studio.saveState === 'saving' ? 'Saving…' : 'Unsaved'}
        </motion.div>
      </div>
    </header>
  )
}