import { useState } from 'react'
import type { NanoProject } from '../../../types/nano'
import { useStudio } from '../../../state/studio'
import { TEMPLATE_MAP } from '../../../data/projects'
import { runTests } from '../../../engine/tests/runner'
import type { TestRunReport } from '../../../engine/tests/runner'
import { Btn, Chip, EmptyState } from '../../ui'

export function TestTab({ project }: { project: NanoProject }) {
  const studio = useStudio()
  const template = project.templateId ? TEMPLATE_MAP[project.templateId] : null
  const [report, setReport] = useState<TestRunReport | null>(
    project.lastTestResults
      ? ({
          outcomes: [],
          passed: project.lastTestResults.passed,
          total: project.lastTestResults.total,
          ranAt: project.lastTestResults.runAt,
          skippedReason: 'Showing the last saved run — press Run tests for details.',
        } as TestRunReport)
      : null,
  )

  if (!template || template.tests.length === 0) {
    return (
      <EmptyState
        icon="🧪"
        title="No test suite for this project yet"
        hint="Guided templates ship with automatic test cases. Blank projects get tests in a future version."
      />
    )
  }

  const execute = () => {
    const result = runTests(project, template.tests)
    setReport(result)
    studio.recordTestRun(project.id, result.passed, result.total)
  }

  return (
    <div className="test-tab">
      <div className="canvas-toolbar">
        <Btn variant="primary" size="sm" onClick={execute}>
          ▶ Run all tests ({template.tests.length})
        </Btn>
        <span className="toolbar-hint dim">
          Each test drives the built-in simulator with a light level and checks the LED response.
        </span>
        <span className="spacer" />
        {report && report.outcomes.length > 0 && (
          <Chip tone={report.passed === report.total ? 'good' : 'bad'}>
            {report.passed}/{report.total} passed ·{' '}
            {Math.round((report.passed / Math.max(1, report.total)) * 100)}%
          </Chip>
        )}
      </div>

      {report?.skippedReason && report.outcomes.length === 0 && (
        <p className="dim small">{report.skippedReason}</p>
      )}

      <div className="test-list">
        {template.tests.map((testCase) => {
          const outcome = report?.outcomes.find((o) => o.case.id === testCase.id)
          return (
            <article key={testCase.id} className={`test-card ${outcome ? (outcome.passed ? 'pass' : 'fail') : ''}`}>
              <header>
                <strong>{testCase.name}</strong>
                {outcome && (
                  <Chip tone={outcome.passed ? 'good' : 'bad'}>
                    {outcome.passed ? '✓ PASSED' : '✗ FAILED'}
                  </Chip>
                )}
              </header>
              <dl>
                <div>
                  <dt>Given</dt>
                  <dd>Light level = {testCase.lightLevel}%</dd>
                </div>
                <div>
                  <dt>Expected</dt>
                  <dd>LED {testCase.expectLed.toUpperCase()}</dd>
                </div>
                {outcome && (
                  <div>
                    <dt>Got</dt>
                    <dd>LED {outcome.actualLed.toUpperCase()}</dd>
                  </div>
                )}
              </dl>
              <p className="dim small">{testCase.explanation}</p>
            </article>
          )
        })}
      </div>

      {report && report.outcomes.length > 0 && report.passed === report.total && (
        <div className="test-celebrate">
          🎉 PROJECT TEST: 100% — your night lamp logic works exactly as designed.
        </div>
      )}
    </div>
  )
}
