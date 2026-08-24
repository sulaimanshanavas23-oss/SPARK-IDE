import type { BuildResult, DetectedBoard, UploadResult } from '../types/nano'

/**
 * Hardware bridge interface.
 *
 * MVP 1 ships NO physical upload. The interface exists so future providers
 * (Arduino via Web Serial + arduino-cli bridge, ESP32, Pi Pico…) can plug in
 * without touching the UI. The UI must never fake an upload: it renders the
 * provider's availability honestly.
 */
export interface HardwareProvider {
  id: string
  name: string
  /** false → the UI shows "not available in this version", never "success". */
  available: boolean
  detectBoards(): Promise<DetectedBoard[]>
  compile(source: string, boardId: string): Promise<BuildResult>
  upload(source: string, boardId: string, port: string): Promise<UploadResult>
}

class NotAvailableProvider implements HardwareProvider {
  id = 'none'
  name = 'No hardware bridge'
  available = false

  async detectBoards(): Promise<DetectedBoard[]> {
    return []
  }

  async compile(): Promise<BuildResult> {
    return { ok: false, message: 'Compiling requires a hardware bridge — not available yet.' }
  }

  async upload(): Promise<UploadResult> {
    return { ok: false, message: 'Uploading requires a hardware bridge — not available yet.' }
  }
}

export const hardwareProvider: HardwareProvider = new NotAvailableProvider()
