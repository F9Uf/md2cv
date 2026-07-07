import { useState, useEffect } from 'react'
import Dialog from './Dialog'
import {
  listUserRepos,
  listBranches,
  listMdFiles,
  type GitHubRepo,
  type GitHubBranch,
  type GitHubMdFile,
} from '../lib/githubRepo'
import type { RepoConfig } from '../hooks/useRepoSync'

interface PickerDialogProps {
  open: boolean
  token: string
  onClose: () => void
  onConnect: (config: RepoConfig) => void
}

export default function PickerDialog({ open, token, onClose, onConnect }: PickerDialogProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [files, setFiles] = useState<GitHubMdFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const step = selectedRepo ? 2 : 1

  // Load repos when dialog opens
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingRepos(true)
    setRepos([])
    setSearch('')
    setSelectedRepo(null)
    setSelectedFile(null)
    setError(null)
    listUserRepos(token)
      .then((r) => {
        if (!cancelled) setRepos(r)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load repositories")
      })
      .finally(() => {
        if (!cancelled) setLoadingRepos(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, token])

  async function selectRepo(r: GitHubRepo) {
    setSelectedRepo(r)
    setSelectedBranch(r.default_branch)
    setFiles([])
    setSelectedFile(null)
    setLoadingFiles(true)
    setError(null)
    try {
      const [branchList, fileList] = await Promise.all([
        listBranches(token, r.owner, r.name),
        listMdFiles(token, r.owner, r.name, r.default_branch),
      ])
      setBranches(branchList)
      setFiles(fileList)
    } catch {
      setError("Couldn't load repository data")
    } finally {
      setLoadingFiles(false)
    }
  }

  async function handleBranchChange(branch: string) {
    if (!selectedRepo) return
    setSelectedBranch(branch)
    setLoadingFiles(true)
    setSelectedFile(null)
    setError(null)
    try {
      const fileList = await listMdFiles(token, selectedRepo.owner, selectedRepo.name, branch)
      setFiles(fileList)
    } catch {
      setError("Couldn't load files")
    } finally {
      setLoadingFiles(false)
    }
  }

  function handleBack() {
    setSelectedRepo(null)
    setSelectedFile(null)
    setBranches([])
    setFiles([])
    setError(null)
  }

  function handleOpenFile() {
    if (!selectedRepo || !selectedFile) return
    onConnect({
      owner: selectedRepo.owner,
      repo: selectedRepo.name,
      branch: selectedBranch,
      defaultBranch: selectedRepo.default_branch,
      filePath: selectedFile,
    })
    onClose()
  }

  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Dialog open={open} title="Connect repository" onClose={onClose} maxWidthClass="max-w-lg">
      {error && (
        <div className="mb-3 text-sm text-red-400">{error}</div>
      )}

      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="Search repositories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-gray-500"
          />
          <div className="max-h-56 overflow-y-auto mt-2 rounded border border-gray-700">
            {loadingRepos ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <span
                  className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-400">Loading repositories…</span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No repositories found</div>
            ) : (
              filteredRepos.map((r) => (
                <button
                  key={r.full_name}
                  role="option"
                  aria-selected={false}
                  onClick={() => selectRepo(r)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                >
                  <span>{r.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(r.pushed_at).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {step === 2 && selectedRepo && (
        <>
          <label className="block text-xs text-gray-400 mb-1">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="h-8 px-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
          >
            {branches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <div className="text-xs text-gray-400 mb-1 mt-3">Select a file</div>
          <div className="max-h-56 overflow-y-auto rounded border border-gray-700">
            {loadingFiles ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <span
                  className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-400">Loading files…</span>
              </div>
            ) : files.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No .md files found</div>
            ) : (
              files.map((file) => (
                <button
                  key={file.path}
                  role="option"
                  aria-selected={selectedFile === file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`w-full text-left px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                    selectedFile === file.path
                      ? 'bg-blue-900/40 text-blue-200'
                      : 'text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  {file.path}
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleBack}
              className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleOpenFile}
              disabled={!selectedFile}
              aria-disabled={!selectedFile}
              className={`h-8 px-3 rounded bg-blue-600 text-white text-sm border border-blue-500 hover:bg-blue-500 transition-colors${
                !selectedFile ? ' opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Open file
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}
