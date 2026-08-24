import { useState } from 'react'
import type { NanoProject } from '../../../types/nano'
import { hardwareProvider } from '../../../services/hardware'
import { Chip, EmptyState } from '../../ui'

/**
 * Deploy tab — MVP 1 ships NO physical upload.
 * Everything here is honest: the provider reports unavailable, buttons are
 * disabled, and the roadmap explains what will arrive.
 */
export function DeployTab({ project }: { project: NanoProject }) {
  const [checking, setChecking] = useState(false)
  const [found, setFound] = useState<string | null>(null)

  const checkForBoards = async () => {
    setChecking(true)
    try {
      const boards = await hardwareProvider.detectBoards()
      setFound(
        boards.length > 0
          ? boards.map((b) => `${b.name} on ${b.port}`).join(', ')
          : 'No hardware bridge is available in this version.',
      )
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="deploy-tab">
      <div className="canvas-toolbar">
        <Chip tone="neutral">Hardware upload — coming in a future version</Chip>
      </div>

      <EmptyState
        icon="🚀"
        title="Physical upload is not wired up yet"
        hint="Nano Spark never fakes an upload. When the hardware bridge ships, this screen will detect your board, compile your code and flash it — with real status at every step."
      />

      <div className="deploy-grid">
        <section className="panel">
          <header className="panel-head">
            <h3>What you can do today</h3>
          </header>
          <div className="panel-body">
            <ul>
              <li>✅ Simulate this project in the browser (Simulate tab)</li>
              <li>✅ Verify it against automatic tests (Test tab)</li>
              <li>✅ Download the sketch as a .ino file (Code tab)</li>
              <li>
                ✅ Use it with the Arduino IDE: open the .ino, select{' '}
                <strong>Arduino UNO</strong>, press Upload
              </li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h3>Hardware bridge status</h3>
          </header>
          <div className="panel-body">
            <p className="small">
              Provider: <strong>{hardwareProvider.name}</strong>{' '}
              {hardwareProvider.available ? (
                <Chip tone="good">available</Chip>
              ) : (
                <Chip tone="warn">not available</Chip>
              )}
            </p>
            <button type="button" onClick={checkForBoards} disabled={checking}>
              {checking ? 'Checking…' : '🔍 Detect boards'}
            </button>
            {found && <p className="dim small">{found}</p>}
            <hr className="soft" />
            <p className="dim small">
              Planned flow: COMPILE → CONNECT BOARD → DETECT → UPLOAD → SERIAL MONITOR,
              via Web Serial + arduino-cli. Board targets after UNO: ESP32, Raspberry Pi Pico, STM32.
            </p>
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h3>Your project snapshot</h3>
          </header>
          <div className="panel-body small">
            <p>
              <strong>{project.name}</strong> · board {project.boardId}
            </p>
            <p>
              {project.circuit.components.length} components ·{' '}
              {project.circuit.connections.length} wires
            </p>
            <p>{project.code.content.split('\n').length} lines of C/C++ ready to compile</p>
          </div>
        </section>
      </div>
    </div>
  )
}
