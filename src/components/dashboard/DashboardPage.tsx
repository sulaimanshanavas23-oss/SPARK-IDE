import { useStudio } from '../../state/studio'
import { validateProject } from '../../engine/circuit/validation'
import { Btn, Chip, Panel, ProgressBar } from '../ui'

function computeProgress(projects: ReturnType<typeof useStudio>['projects']) {
  if (projects.length === 0) return { electronics: 0, coding: 0, simulation: 0 }
  let electronics = 0
  let coding = 0
  let simulation = 0
  for (const p of projects) {
    const report = validateProject(p)
    const hasSensor = p.circuit.components.some((c) => c.defId === 'ldr')
    const hasOutput = p.circuit.components.some((c) => c.defId === 'led')
    if (hasSensor && hasOutput && report.errors === 0) electronics += 1
    if (p.code.content.trim().length > 40) coding += 1
    if (p.lastTestResults && p.lastTestResults.total > 0 && p.lastTestResults.passed === p.lastTestResults.total)
      simulation += 1
  }
  return {
    electronics: (electronics / projects.length) * 100,
    coding: (coding / projects.length) * 100,
    simulation: (simulation / projects.length) * 100,
  }
}

export function DashboardPage() {
  const studio = useStudio()
  const progress = computeProgress(studio.projects)
  const recent = [...studio.projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4)

  return (
    <div className="page dashboard">
      <section className="hero">
        <div>
          <h1>
            Welcome to Nano Spark<span className="dot">.</span>
          </h1>
          <p className="hero-sub">
            Technology • Innovations • Solutions — design it digitally, simulate it virtually,
            build it physically.
          </p>
          <div className="hero-flow" aria-label="workflow">
            {['Design', 'Code', 'Simulate', 'Test', 'Debug', 'Deploy', 'Compete', 'Innovate'].map(
              (step, i) => (
                <span key={step} className="flow-step">
                  {i > 0 && <span className="flow-arrow">→</span>}
                  {step}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="hero-actions">
          <Btn variant="primary" onClick={() => studio.navigate('projects')}>
            Start a project →
          </Btn>
        </div>
      </section>

      <div className="dash-grid">
        <Panel title="My progress" className="span-2">
          {studio.projects.length === 0 ? (
            <p className="dim">Create your first project to start tracking progress.</p>
          ) : (
            <div className="progress-rows">
              <label>Electronics</label>
              <ProgressBar value={progress.electronics} />
              <label>Coding</label>
              <ProgressBar value={progress.coding} />
              <label>Simulation</label>
              <ProgressBar value={progress.simulation} />
            </div>
          )}
        </Panel>

        <Panel title="Stats">
          <div className="stat-grid">
            <div className="stat">
              <strong>{studio.projects.length}</strong>
              <span>projects</span>
            </div>
            <div className="stat">
              <strong>{studio.projects.filter((p) => p.flags.simulatedAt).length}</strong>
              <span>simulated</span>
            </div>
            <div className="stat">
              <strong>{studio.projects.filter((p) => p.lastTestResults).length}</strong>
              <span>tested</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent projects"
        actions={
          <Btn size="sm" onClick={() => studio.navigate('projects')}>
            View all
          </Btn>
        }
      >
        {recent.length === 0 ? (
          <p className="dim">Nothing here yet. Open the Project Library and build your first circuit.</p>
        ) : (
          <ul className="recent-list">
            {recent.map((p) => {
              const report = validateProject(p)
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => studio.openWorkspace(p.id)}>
                    <span className="recent-name">{p.name}</span>
                    <span className="recent-meta">
                      {report.errors === 0 ? (
                        <Chip tone="good">circuit ok</Chip>
                      ) : (
                        <Chip tone="bad">{report.errors} issue{report.errors === 1 ? '' : 's'}</Chip>
                      )}
                      {p.lastTestResults && (
                        <Chip tone={p.lastTestResults.passed === p.lastTestResults.total ? 'good' : 'warn'}>
                          tests {p.lastTestResults.passed}/{p.lastTestResults.total}
                        </Chip>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
