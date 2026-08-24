import { useEffect, useMemo, useRef, useState } from 'react'
import type { NanoProject, SimEnvironment, SimState } from '../../../types/nano'
import { useStudio } from '../../../state/studio'
import {
  createSimState,
  envToAnalog,
  stepIteration,
} from '../../../engine/simulation/engine'
import { getComponentDef } from '../../../data/components'
import { Btn, Chip, EmptyState } from '../../ui'

const TICK_MS = 320

export function SimulateTab({ project }: { project: NanoProject }) {
  const studio = useStudio()
  const [running, setRunning] = useState(false)
  const [state, setState] = useState<SimState>(createSimState)
  const [env, setEnv] = useState<SimEnvironment>({ lightLevel: 80, knobLevel: 50 })
  const envRef = useRef<SimEnvironment>(env)
  useEffect(() => {
    envRef.current = env
  }, [env])
  const serialRef = useRef<HTMLDivElement>(null)

  const hasLdr = project.circuit.components.some((c) => c.defId === 'ldr')
  const hasKnob = project.circuit.components.some((c) => c.defId === 'potentiometer')
  const leds = useMemo(
    () => project.circuit.components.filter((c) => getComponentDef(c.defId)?.simulationType === 'led'),
    [project.circuit.components],
  )
  const buzzers = useMemo(
    () => project.circuit.components.filter((c) => getComponentDef(c.defId)?.simulationType === 'buzzer'),
    [project.circuit.components],
  )

  /* --------------------------- interpreter loop --------------------------- */
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setState((prev) => {
        const next: SimState = JSON.parse(JSON.stringify(prev))
        stepIteration(project, next, envRef.current)
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [running, project])

  // Auto-scroll serial monitor.
  useEffect(() => {
    const el = serialRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.serialLog.length])

  const reset = () => {
    setRunning(false)
    setState(createSimState())
  }

  const toggleRun = () => {
    if (!running) studio.markSimulated(project.id)
    setRunning((r) => !r)
  }

  const anyLedOn = leds.some((l) => state.outputs[l.id])
  const reading = envToAnalog(env.lightLevel)

  /* ----------------------------- guards ---------------------------------- */

  if (!project.code.syncedFromBlocks) {
    return (
      <EmptyState
        icon="🛠️"
        title="The built-in simulator runs block programs"
        hint="Your C/C++ was hand-edited, so the simulator can no longer guarantee what the board would do. Resync the code from your blocks to simulate again."
      />
    )
  }
  if (leds.length === 0 && buzzers.length === 0) {
    return (
      <EmptyState
        icon="💡"
        title="Nothing to switch on yet"
        hint="Add an LED (or buzzer) and wire it to a digital pin in the Design tab."
      />
    )
  }

  return (
    <div className="sim-tab">
      <div className="canvas-toolbar">
        <Btn variant={running ? 'subtle' : 'primary'} size="sm" onClick={toggleRun}>
          {running ? '⏸ Pause' : '▶ Run simulation'}
        </Btn>
        <Btn size="sm" onClick={reset}>
          ⟲ Reset
        </Btn>
        <Chip tone="neutral">loop #{state.iteration}</Chip>
        <Chip tone="neutral">virtual time {state.virtualMs} ms</Chip>
        <span className="spacer" />
        <span
          className="chip chip-neutral"
          title="Executes your block program against a simplified model of the components. A Wokwi-class circuit simulator is planned for a future version."
        >
          ℹ Built-in MVP simulator
        </span>
      </div>

      <div className="sim-grid">
        {/* ------------------------- virtual world ------------------------- */}
        <section className="panel sim-world-panel">
          <header className="panel-head">
            <h3>Virtual room</h3>
            <span className={`chip ${anyLedOn ? 'chip-good' : 'chip-bad'}`}>
              LAMP {anyLedOn ? 'ON' : 'OFF'}
            </span>
          </header>
          <div
            className="sim-room"
            style={{
              background: `radial-gradient(circle at 50% 20%, rgba(255,212,64,${env.lightLevel / 260}), transparent 70%), linear-gradient(#10131c, #1a1f2e)`,
              opacity: 1,
            }}
          >
            {leds.map((led) => {
              const on = !!state.outputs[led.id]
              return (
                <div key={led.id} className="sim-device">
                  <div
                    className={`sim-led ${on ? 'on' : ''}`}
                    style={{ boxShadow: on ? '0 0 42px 14px rgba(255,200,60,.55)' : undefined }}
                    aria-label={`${led.label} ${on ? 'on' : 'off'}`}
                  />
                  <span>{led.label}</span>
                </div>
              )
            })}
            {buzzers.map((buzzer) => {
              const on = !!state.outputs[buzzer.id]
              return (
                <div key={buzzer.id} className="sim-device">
                  <div className={`sim-buzzer ${on ? 'on' : ''}`} aria-label={`${buzzer.label} ${on ? 'on' : 'off'}`}>
                    🔔
                  </div>
                  <span>{buzzer.label} {on ? '(beeping)' : '(silent)'}</span>
                </div>
              )
            })}
            {leds.length === 0 && buzzers.length === 0 && (
              <p className="dim">No outputs in this circuit yet.</p>
            )}
          </div>
          <p className="dim small sim-room-note">
            Room brightness follows your light slider — slide towards night to watch the lamp react.
          </p>
        </section>

        {/* --------------------------- controls ---------------------------- */}
        <section className="panel sim-controls">
          <header className="panel-head">
            <h3>Environment</h3>
          </header>
          <div className="panel-body">
            {hasLdr && (
              <label className="slider-row">
                <span>☀️ Light level</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={env.lightLevel}
                  onChange={(e) => setEnv((prev) => ({ ...prev, lightLevel: Number(e.target.value) }))}
                />
                <strong>{env.lightLevel}%</strong>
              </label>
            )}
            {hasLdr && (
              <p className="dim tiny">
                LDR analog reading: <strong>{reading}</strong> / 1023
                {' '}({env.lightLevel < 50 ? 'dark side' : 'bright side'})
              </p>
            )}
            {hasKnob && (
              <label className="slider-row">
                <span>🎛️ Knob position</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={env.knobLevel}
                  onChange={(e) => setEnv((prev) => ({ ...prev, knobLevel: Number(e.target.value) }))}
                />
                <strong>{env.knobLevel}%</strong>
              </label>
            )}
            {!hasLdr && (
              <p className="dim">
                No sensor in this circuit — add an LDR in Design to control the environment here.
              </p>
            )}
            <hr className="soft" />
            <h4>Variables</h4>
            {Object.keys(state.variables).length === 0 ? (
              <p className="dim small">Run the simulation to see sensor values appear.</p>
            ) : (
              <ul className="var-list">
                {Object.entries(state.variables).map(([name, value]) => (
                  <li key={name}>
                    <code>{name}</code> <strong>{value}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* -------------------------- serial monitor ------------------------ */}
        <section className="panel sim-serial span-2">
          <header className="panel-head">
            <h3>Serial monitor</h3>
            <button
              type="button"
              className="link-btn"
              onClick={() => setState((prev) => ({ ...prev, serialLog: [] }))}
            >
              clear
            </button>
          </header>
          <div className="serial-body" ref={serialRef}>
            {state.serialLog.length === 0 ? (
              <p className="dim">Press ▶ Run — each loop() pass logs its sensor reads and outputs here.</p>
            ) : (
              state.serialLog.map((line) => (
                <div key={line.id} className="serial-line">
                  <span className="time">{line.time}</span>
                  {line.text}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
