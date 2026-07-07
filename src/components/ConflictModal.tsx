import Dialog from './Dialog'

interface ConflictModalProps {
  open: boolean
  onKeepLocal: () => void
  onUseRemote: () => void
}

export default function ConflictModal({ open, onKeepLocal, onUseRemote }: ConflictModalProps) {
  return (
    <Dialog open={open} title="Your local edits differ from GitHub">
      <p className="text-sm text-gray-300 mb-6">Choose which version to keep. This cannot be undone.</p>
      <div className="flex flex-col gap-2">
        <button
          onClick={onKeepLocal}
          className="h-9 w-full rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
        >
          Keep my local version
        </button>
        <button
          onClick={onUseRemote}
          className="h-9 w-full rounded bg-red-800 text-white text-sm border border-red-700 hover:bg-red-700 transition-colors"
        >
          Use GitHub version
        </button>
      </div>
    </Dialog>
  )
}
