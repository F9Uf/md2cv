import './App.css'
import Header from './components/Header'

function App() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex min-h-0">
        <div className="flex-1 bg-white border-r border-gray-200 p-4">
          <p className="text-gray-400">Editor pane (Phase 2)</p>
        </div>
        <div className="flex-1 bg-white p-4">
          <p className="text-gray-400">Preview pane (Phase 2)</p>
        </div>
      </main>
    </div>
  )
}

export default App
