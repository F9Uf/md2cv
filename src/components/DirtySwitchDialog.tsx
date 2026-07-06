import Dialog from './Dialog'

interface DirtySwitchDialogProps {
  open: boolean
  currentFilename: string
  committing: boolean
  onCommit: () => void     // opens the Phase 12 CommitDialog flow
  onDiscard: () => void
  onCancel: () => void
}

export default function DirtySwitchDialog({
  open, currentFilename, committing, onCommit, onDiscard, onCancel,
}: DirtySwitchDialogProps) {
  return (
    <Dialog open={open} title="Unsaved Changes" onClose={onCancel}>
      <p className="text-sm text-gray-300 mb-6">
        <strong>{currentFilename}</strong> has uncommitted changes. What would you like to do?
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={onCommit}
          disabled={committing}
          className="h-9 w-full rounded bg-blue-600 text-white text-sm border border-blue-500 hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Commit changes…
        </button>
        <button
          onClick={onDiscard}
          className="h-9 w-full rounded text-red-400 text-sm hover:bg-gray-800 transition-colors"
        >
          Discard my edits
        </button>
        <button
          onClick={onCancel}
          className="h-9 w-full rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </Dialog>
  )
}
