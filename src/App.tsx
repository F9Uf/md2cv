import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex">
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
