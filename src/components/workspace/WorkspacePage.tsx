import { useStudio } from '../../state/studio'
import type { WorkspaceTab } from '../../state/studio'
import { validateProject } from '../../engine/circuit/validation'
import { Btn, Chip } from '../ui'
import { DesignTab } from './design/DesignTab'
import { LogicTab } from './logic/LogicTab'
import { BlocksTab } from './blocks/BlocksTab'
import { CodeTab } from './code/CodeTab'
import { SimulateTab } from './simulate/SimulateTab'
import { TestTab } from './test/TestTab'
import { DeployTab } from './deploy/DeployTab'

const STAGES = ['DRAFT', 'DESIGNED', 'CODED', 'SIMULATED', 'TESTED'] as const

function currentStage(project: NonNullable<ReturnType<typeof useStudio>['activeProject']>): string {
  if (project.lastTestResults && project.lastTestResults.total > 0) return 'TESTED'
  if (project.flags.simulatedAt) return 'SIMULATED'
  if (project.code.content.length > 40) return 'CODED'
  if (project.circuit.components.length > 1) return 'DESIGNED'
  return 'DRAFT'
}

export function WorkspacePage() {
  const studio = useStudio()
  const project = studio.activeProject

  if (!project) {
    return (
      <div className="page center-note">
        <p className="dim">No project open — pick one from the library.</p>
        <Btn variant="primary" onClick={() => studio.navigate('projects')}>
          Browse projects
        </Btn>
      </div>
    )
  }

  const report = validateProject(project)
  const stage = currentStage(project)

  const tabBar: Array<{ id: WorkspaceTab; label: string; badge?: string }> = [
    { id: 'design', label: 'Design', badge: report.errors > 0 ? String(report.errors) : undefined },
    { id: 'logic', label: 'Logic' },
    { id: 'blocks', label: 'Blocks' },
    { id: 'code', label: 'Code' },
    { id: 'simulate', label: 'Simulate' },
    { id: 'test', label: 'Test' },
    { id: 'deploy', label: 'Deploy' },
  ]

  return (
    <div className="workspace">
      <div className="workspace-head">
        <input
          className="project-title"
          value={project.name}
          onChange={(e) => studio.renameProject(project.id, e.target.value)}
          aria-label="Project name"
        />
        <Chip tone="neutral">Arduino UNO</Chip>

        <div className="stage-track" aria-label="project stage">
          {STAGES.map((s) => {
            const reached = STAGES.indexOf(s as (typeof STAGES)[number]) <= STAGES.indexOf(stage as (typeof STAGES)[number])
            return (
              <span key={s} className={`stage ${reached ? 'reached' : ''} ${s === stage ? 'now' : ''}`}>
                {s}
              </span>
            )
          })}
        </div>

        <span className="spacer" />
        <button
          type="button"
          onClick={() => studio.resetToTemplateStart(project.id)}
          title="Restore the guided starter circuit, blocks and code"
          disabled={!project.templateId}
        >
          ⟲ Reset to template
        </button>
      </div>

      <nav className="workspace-tabs">
        {tabBar.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={studio.view.tab === tab.id ? 'active' : ''}
            onClick={() => studio.setTab(tab.id)}
          >
            {tab.label}
            {tab.badge && <span className="badge-count">{tab.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="workspace-body">
        {studio.view.tab === 'design' && <DesignTab key={`d-${project.id}`} project={project} />}
        {studio.view.tab === 'logic' && <LogicTab project={project} />}
        {studio.view.tab === 'blocks' && <BlocksTab project={project} />}
        {studio.view.tab === 'code' && <CodeTab project={project} />}
        {studio.view.tab === 'simulate' && <SimulateTab project={project} />}
        {studio.view.tab === 'test' && <TestTab project={project} />}
        {studio.view.tab === 'deploy' && <DeployTab project={project} />}
      </div>
    </div>
  )
}
