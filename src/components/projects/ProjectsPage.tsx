import { useState } from 'react'
import { useStudio } from '../../state/studio'
import { PROJECT_TEMPLATES } from '../../data/projects'
import { getBoard } from '../../data/boards'
import { Btn, Chip, Panel } from '../ui'

export function ProjectsPage() {
  const studio = useStudio()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="page projects">
      <h1>Project Library</h1>
      <p className="dim">
        Guided projects take you from an empty canvas to a working, tested build.
      </p>

      <Panel title="Guided projects">
        <div className="template-grid">
          {PROJECT_TEMPLATES.map((t) => {
            const board = getBoard(t.boardId)
            return (
              <article key={t.id} className="template-card">
                <header>
                  <span className="template-emoji" aria-hidden>
                    {t.emoji}
                  </span>
                  <div>
                    <h3>{t.title}</h3>
                    <span className="template-meta">
                      {t.difficulty} · {t.level} · {board?.name ?? t.boardId}
                    </span>
                  </div>
                </header>
                <p>{t.blurb}</p>
                <ul className="learn-list">
                  {t.learning.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <footer>
                  <Btn variant="primary" size="sm" onClick={() => studio.createFromTemplate(t.id, 'guided')}>
                    Open project
                  </Btn>
                  <Btn size="sm" onClick={() => studio.createFromTemplate(t.id, 'scratch')}>
                    Start from scratch
                  </Btn>
                  <Btn
                    size="sm"
                    onClick={() => {
                      const id = studio.createFromTemplate(t.id, 'guided')
                      if (id) studio.openWorkspace(id, 'simulate')
                    }}
                  >
                    Simulate
                  </Btn>
                </footer>
              </article>
            )
          })}

          <article className="template-card blank-card">
            <header>
              <span className="template-emoji" aria-hidden>
                ✨
              </span>
              <div>
                <h3>Your own idea</h3>
                <span className="template-meta">Blank workspace · Arduino UNO</span>
              </div>
            </header>
            <p>Start with just a board and build whatever you imagine.</p>
            <footer>
              <Btn
                size="sm"
                onClick={() => {
                  const id = studio.createFromTemplate('automatic-night-lamp', 'scratch')
                  if (id) studio.openWorkspace(id, 'design')
                }}
              >
                Create blank project
              </Btn>
            </footer>
          </article>
        </div>
      </Panel>

      <Panel title={`My projects (${studio.projects.length})`}>
        {studio.projects.length === 0 ? (
          <p className="dim">No projects yet — pick one above to get started.</p>
        ) : (
          <table className="project-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Updated</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {studio.projects.map((p) => {
                const tests = p.lastTestResults
                return (
                  <tr key={p.id}>
                    <td>
                      <button type="button" className="link-btn" onClick={() => studio.openWorkspace(p.id)}>
                        {p.name}
                      </button>
                    </td>
                    <td>
                      {tests ? (
                        tests.passed === tests.total ? (
                          <Chip tone="good">✓ {tests.passed}/{tests.total} tests</Chip>
                        ) : (
                          <Chip tone="warn">{tests.passed}/{tests.total} tests</Chip>
                        )
                      ) : (
                        <Chip>draft</Chip>
                      )}
                    </td>
                    <td className="dim">{new Date(p.updatedAt).toLocaleString()}</td>
                    <td className="row-actions">
                      <Btn size="sm" onClick={() => studio.openWorkspace(p.id)}>
                        Open
                      </Btn>
                      <Btn size="sm" onClick={() => studio.duplicateProject(p.id)}>
                        Duplicate
                      </Btn>
                      {confirmDelete === p.id ? (
                        <>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              studio.deleteProject(p.id)
                              setConfirmDelete(null)
                            }}
                          >
                            Confirm delete
                          </Btn>
                          <Btn size="sm" onClick={() => setConfirmDelete(null)}>
                            Keep
                          </Btn>
                        </>
                      ) : (
                        <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(p.id)}>
                          Delete
                        </Btn>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
