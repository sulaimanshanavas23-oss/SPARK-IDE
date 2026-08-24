import { StudioProvider } from './state/studio'
import { Shell } from './components/Shell'

export default function App() {
  return (
    <StudioProvider>
      <Shell />
    </StudioProvider>
  )
}
