import { useState, useEffect } from 'react'
import Dialog from './Dialog'

interface CommitDialogProps {
  open: boolean
  filename: string        // e.g. "resume.md" (basename of the repo file path)
  committing: boolean
  onClose: () => void
  onCommit: (message: string) => void
}

export default function CommitDialog({ open, filename, committing, onClose, onCommit }: CommitDialogProps) {
  const [message, setMessage] = useState(`Update ${filename}`)

  // Reset default message whenever the dialog opens or filename changes
  useEffect(() => {
    if (open) setMessage(`Update ${filename}`)
  }, [open, filename])

  const isEmpty = message.trim() === ''
  const isDisabled = committing || isEmpty

  return (
    <Dialog open={open} title="Commit to GitHub" onClose={onClose}>
      <label className="block text-xs text-gray-400 mb-1">Commit message</label>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="h-8 w-full px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-gray-500"
      />

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
        >
          Discard
        </button>
        <button
          disabled={isDisabled}
          aria-disabled={isEmpty ? true : undefined}
          aria-busy={committing ? true : undefined}
          onClick={isDisabled ? undefined : () => onCommit(message.trim())}
          className={`h-8 px-3 rounded bg-blue-600 text-white text-sm border border-blue-500 transition-colors flex items-center gap-1${
            isEmpty || committing
              ? ' opacity-50 cursor-not-allowed'
              : ' hover:bg-blue-500'
          }`}
        >
          {committing ? (
            <>
              <span
                className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"
                aria-hidden="true"
              />
              Committing…
            </>
          ) : (
            'Commit Changes'
          )}
        </button>
      </div>
    </Dialog>
  )
}
