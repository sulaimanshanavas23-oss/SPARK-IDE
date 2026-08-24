import { motion, AnimatePresence } from 'framer-motion'
import { useStudio } from '../../state/studio'
import type { PlacedComponent } from '../../types/nano'

export function Sidebar() {
  const studio = useStudio()
  const isWorkspace = studio.view.page === 'workspace'
  const project = studio.activeProject

  return (
    <motion.aside
      className={`fixed top-[48px] left-[56px] bottom-[28px] z-30 bg-ink-panel border-r border-ink-line flex flex-col transition-layout overflow-hidden`}
      style={{ width: isWorkspace ? '256px' : '0' }}
      initial={false}
      animate={{ width: isWorkspace ? 256 : 0 }}
      transition={{ duration: 280, ease: [0.4, 0, 0.2, 1] }}
      role="complementary"
      aria-label={isWorkspace ? 'Project explorer' : 'Sidebar collapsed'}
    >
      {isWorkspace && (
        <AnimatePresence mode="wait">
          <motion.div
            key={studio.view.page}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 150 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {studio.view.page === 'dashboard' && <DashboardSidebar />}
            {studio.view.page === 'projects' && <ProjectsSidebar />}
            {studio.view.page === 'workspace' && project && <WorkspaceSidebar project={project} />}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.aside>
  )
}

function DashboardSidebar() {
  const studio = useStudio()
  const recent = [...studio.projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)

  return (
    <div className="flex-1 flex flex-col p-3 overflow-y-auto">
      <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-nsGray-medium">
        Recent Projects
      </div>
      {recent.length === 0 ? (
        <motion.div
          className="flex-1 flex flex-col items-center justify-center text-center px-4 text-nsGray-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-4xl mb-2">📁</span>
          <p className="font-medium">No projects yet</p>
          <p className="text-sm mt-1">Click "Start a project" to begin</p>
        </motion.div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1" role="list">
          {recent.map((p) => (
            <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 }}>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm hover:bg-ink-raised transition-micro"
                onClick={() => studio.openWorkspace(p.id)}
              >
                <span className="w-8 h-8 rounded-lg bg-spark/10 flex items-center justify-center text-spark text-lg" aria-hidden>
                  💡
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-nsGray-medium truncate">
                    {new Date(p.updatedAt).toLocaleDateString()} · {p.circuit.components.length} components
                  </p>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
      <motion.button
        className="w-full mt-3 px-3 py-2 rounded-lg bg-spark/15 text-spark font-medium text-sm hover:bg-spark/25 transition-micro flex items-center justify-center gap-2"
        onClick={() => studio.navigate('projects')}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <span aria-hidden>➕</span> Browse all projects
      </motion.button>
    </div>
  )
}

function ProjectsSidebar() {
  const studio = useStudio()

  return (
    <div className="flex-1 flex flex-col p-3 overflow-y-auto">
      <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-nsGray-medium">
        Templates
      </div>
      <ul className="flex-1 overflow-y-auto space-y-2">
        {[
          { id: 'automatic-night-lamp', title: 'Automatic Night Lamp', emoji: '💡', desc: 'LDR + LED + Arduino UNO' },
        ].map((t) => (
          <motion.li key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 200 }}>
            <button
              className="w-full p-3 rounded-xl bg-ink-raised border border-ink-line hover:border-spark/30 hover:bg-ink-panel transition-micro text-left flex items-start gap-3"
              onClick={() => studio.createFromTemplate(t.id, 'guided')}
            >
              <span className="w-10 h-10 rounded-lg bg-spark/15 flex items-center justify-center text-xl" aria-hidden>{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{t.title}</p>
                <p className="text-xs text-nsGray-medium truncate">{t.desc}</p>
              </div>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function WorkspaceSidebar({ project }: { project: NonNullable<ReturnType<typeof useStudio>['activeProject']> }) {
  const studio = useStudio()

  return (
    <div className="flex-1 flex flex-col p-3 overflow-y-auto">
      <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-nsGray-medium">
        Project
      </div>
      <motion.div className="mb-3 p-3 rounded-xl bg-ink-raised border border-ink-line" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg bg-spark/15 flex items-center justify-center text-spark text-lg" aria-hidden>💡</span>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={project.name}
              onChange={(e) => studio.renameProject(project.id, e.target.value)}
              className="w-full bg-transparent text-sm font-medium focus:outline-none text-nsWhite placeholder-nsGray-medium"
              placeholder="Project name"
            />
            <p className="text-xs text-nsGray-medium">Arduino UNO · {project.circuit.components.length} parts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-spark/15 text-spark hover:bg-spark/25 transition-micro" onClick={() => studio.resetToTemplateStart(project.id)}>⟲ Reset</button>
          <button className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-ink-editor text-nsGray-medium hover:text-nsWhite hover:bg-ink-line transition-micro" onClick={() => studio.duplicateProject(project.id)}>⧉ Duplicate</button>
          <button className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-err/15 text-err hover:bg-err/25 transition-micro" onClick={() => studio.deleteProject(project.id)}>🗑 Delete</button>
        </div>
      </motion.div>

      <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-nsGray-medium">
        Components
      </div>
      <ul className="flex-1 overflow-y-auto space-y-1">
        {project.circuit.components.map((comp: PlacedComponent) => (
          <motion.li key={comp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.01 }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-raised transition-micro text-sm">
              <span className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ background: `${getComponentColor(comp)}20`, color: getComponentColor(comp) }} aria-hidden>
                {getComponentIcon(comp)}
              </span>
              <span className="truncate font-medium">{comp.label}</span>
              <span className="text-xs text-nsGray-medium ml-auto">{comp.defId}</span>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function getComponentColor(comp: { defId: string }) {
  const colors: Record<string, string> = {
    'board-uno': '#00979d',
    ldr: '#FFD166',
    led: '#FF8A3D',
    resistor: '#D7DDE8',
    'potentiometer': '#C9A0FF',
    button: '#9AA7FF',
    buzzer: '#6BD6A8',
  }
  return colors[comp.defId] || '#888'
}

function getComponentIcon(comp: { defId: string }) {
  const icons: Record<string, string> = {
    'board-uno': '🧠',
    ldr: '🔆',
    led: '💡',
    resistor: '〰️',
    'potentiometer': '🎛️',
    button: '🔘',
    buzzer: '🔔',
  }
  return icons[comp.defId] || '📦'
}