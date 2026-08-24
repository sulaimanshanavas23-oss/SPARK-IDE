/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { BlockProgram, CircuitData, NanoProject } from '../types/nano'
import { instantiateTemplate } from '../data/projects'
import { generateCode } from '../engine/blocks/codegen'
import { loadStudio, saveStudio } from '../services/storage'

export type Page = 'dashboard' | 'projects' | 'workspace'
export type WorkspaceTab =
  | 'design'
  | 'logic'
  | 'blocks'
  | 'code'
  | 'simulate'
  | 'test'
  | 'deploy'

export interface View {
  page: Page
  tab: WorkspaceTab
}

interface StudioContextValue {
  projects: NanoProject[]
  activeProject: NanoProject | null
  view: View
  saveState: 'saved' | 'dirty' | 'saving'

  navigate(page: Page): void
  openWorkspace(projectId: string, tab?: WorkspaceTab): void
  setTab(tab: WorkspaceTab): void

  createFromTemplate(templateId: string, mode: 'guided' | 'scratch'): string | null
  duplicateProject(id: string): void
  deleteProject(id: string): void
  renameProject(id: string, name: string): void

  updateCircuit(id: string, next: CircuitData): void
  updateBlocks(id: string, next: BlockProgram): void
  updateCode(id: string, content: string, synced: boolean): void
  markSimulated(id: string): void
  recordTestRun(id: string, passed: number, total: number): void
  resetToTemplateStart(id: string): void
}

const StudioContext = createContext<StudioContextValue | null>(null)

let idSeq = 0
function freshId(prefix: string): string {
  idSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function makeProject(
  templateId: string,
  mode: 'guided' | 'scratch',
): NanoProject | null {
  const built = instantiateTemplate(templateId, mode)
  if (!built) return null
  const now = Date.now()
  const project: NanoProject = {
    id: freshId('prj'),
    name: mode === 'guided' ? built.name : `${built.name} — My Version`,
    templateId,
    createdAt: now,
    updatedAt: now,
    boardId: 'arduino-uno',
    circuit: built.circuit,
    blocks: built.blocks,
    code: { content: '', syncedFromBlocks: true },
    notes: '',
    flags: {},
  }
  project.code.content = generateCode(project).code
  return project
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadStudio(), [])
  const [projects, setProjects] = useState<NanoProject[]>(initial.projects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    initial.activeProjectId,
  )
  const [view, setView] = useState<View>({ page: 'dashboard', tab: 'design' })
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving'>('saved')
  const firstRender = useRef(true)

  /* ------------------------------- Autosave ------------------------------- */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      saveStudio({ projects, activeProjectId })
      setSaveState('saved')
    }, 600)
    return () => window.clearTimeout(timer)
  }, [projects, activeProjectId])

  /* ------------------------------- Navigation ----------------------------- */

  const navigate = useCallback((page: Page) => {
    setView((v) => ({ ...v, page }))
  }, [])

  const openWorkspace = useCallback((projectId: string, tab: WorkspaceTab = 'design') => {
    setActiveProjectId(projectId)
    setView({ page: 'workspace', tab })
  }, [])

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )

  const patch = useCallback((id: string, mutator: (draft: NanoProject) => void) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const draft = clone(p)
        mutator(draft)
        draft.updatedAt = Date.now()
        return draft
      }),
    )
    setSaveState('dirty')
  }, [])

  /* -------------------------------- Actions ------------------------------- */

  const createFromTemplate = useCallback(
    (templateId: string, mode: 'guided' | 'scratch'): string | null => {
      const project = makeProject(templateId, mode)
      if (!project) return null
      setProjects((prev) => [project, ...prev])
      setActiveProjectId(project.id)
      setView({ page: 'workspace', tab: 'design' })
      return project.id
    },
    [],
  )

  const value: StudioContextValue = useMemo(
    () => ({
      projects,
      activeProject,
      view,
      saveState,
      navigate,
      openWorkspace,
      setTab: (tab) => setView((v) => ({ ...v, tab })),
      createFromTemplate,
      duplicateProject: (id) => {
        const source = projects.find((p) => p.id === id)
        if (!source) return
        const copy = clone(source)
        copy.id = freshId('prj')
        copy.name = `${source.name} copy`
        copy.createdAt = Date.now()
        copy.updatedAt = Date.now()
        copy.lastTestResults = undefined
        copy.flags = {}
        setProjects((prev) => [copy, ...prev])
      },
      deleteProject: (id) => {
        setProjects((prev) => prev.filter((p) => p.id !== id))
        if (activeProjectId === id) setActiveProjectId(null)
      },
      renameProject: (id, name) =>
        patch(id, (draft) => {
          draft.name = name
        }),
      updateCircuit: (id, next) =>
        patch(id, (draft) => {
          draft.circuit = next
          if (draft.code.syncedFromBlocks) draft.code.content = generateCode(draft).code
        }),
      updateBlocks: (id, next) =>
        patch(id, (draft) => {
          draft.blocks = next
          if (draft.code.syncedFromBlocks) draft.code.content = generateCode(draft).code
        }),
      updateCode: (id, content, synced) =>
        patch(id, (draft) => {
          draft.code.content = content
          draft.code.syncedFromBlocks = synced
        }),
      markSimulated: (id) =>
        patch(id, (draft) => {
          draft.flags.simulatedAt = Date.now()
        }),
      recordTestRun: (id, passed, total) =>
        patch(id, (draft) => {
          draft.lastTestResults = { runAt: Date.now(), passed, total }
        }),
      resetToTemplateStart: (id) => {
        const source = projects.find((p) => p.id === id)
        if (!source?.templateId) return
        patch(id, (draft) => {
          const rebuilt = makeProject(source.templateId!, 'guided')
          if (!rebuilt) return
          draft.circuit = rebuilt.circuit
          draft.blocks = rebuilt.blocks
          draft.code = { content: generateCode({ ...draft, blocks: rebuilt.blocks }).code, syncedFromBlocks: true }
          draft.lastTestResults = undefined
          draft.flags = {}
        })
      },
    }),
    [
      projects,
      activeProject,
      activeProjectId,
      view,
      saveState,
      navigate,
      openWorkspace,
      createFromTemplate,
      patch,
    ],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>')
  return ctx
}
