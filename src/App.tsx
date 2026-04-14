import './App.css'
import Header from './components/Header'
import SplitPane from './components/SplitPane'
import MobileTabs from './components/MobileTabs'
import { useMediaQuery } from './hooks/useMediaQuery'

function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const editorPlaceholder = (
    <div className="p-4 h-full">
      <p className="text-gray-400">Editor pane (Phase 2)</p>
    </div>
  )

  const previewPlaceholder = (
    <div className="p-4 h-full">
      <p className="text-gray-400">Preview pane (Phase 2)</p>
    </div>
  )

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex min-h-0">
        {isDesktop ? (
          <SplitPane
            left={editorPlaceholder}
            right={previewPlaceholder}
          />
        ) : (
          <MobileTabs
            editorContent={editorPlaceholder}
            previewContent={previewPlaceholder}
          />
        )}
      </main>
    </div>
  )
}

export default App
