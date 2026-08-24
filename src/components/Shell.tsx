import { motion } from 'framer-motion'
import { useStudio } from '../state/studio'
import { TitleBar } from './shell/TitleBar'
import { ActivityBar } from './shell/ActivityBar'
import { Sidebar } from './shell/Sidebar'
import { TabStrip } from './shell/TabStrip'
import { Breadcrumbs } from './shell/Breadcrumbs'
import { BottomPanel } from './shell/BottomPanel'
import { StatusBar } from './shell/StatusBar'
import { DashboardPage } from './dashboard/DashboardPage.tsx'
import { ProjectsPage } from './projects/ProjectsPage.tsx'
import { WorkspacePage } from './workspace/WorkspacePage.tsx'

function Router() {
  const studio = useStudio()
  switch (studio.view.page) {
    case 'projects':
      return <ProjectsPage />
    case 'workspace':
      return <WorkspacePage />
    case 'dashboard':
    default:
      return <DashboardPage />
  }
}

export function Shell() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink-DEFAULT font-body">
      <TitleBar />
      <ActivityBar />
      <Sidebar />
      <motion.main
        className="fixed top-[48px] left-[56px] right-0 bottom-[28px] flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 300 }}
        style={{ marginLeft: 256 }}
      >
        <TabStrip project={useStudio().activeProject} />
        <Breadcrumbs />
        <div className="flex-1 flex overflow-hidden">
          <Router />
        </div>
        <BottomPanel />
      </motion.main>
      <StatusBar />
    </div>
  )
}