import { useState, type ReactNode } from 'react'

interface MobileTabsProps {
  editorContent: ReactNode
  previewContent: ReactNode
}

export default function MobileTabs({ editorContent, previewContent }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor') // per D-06: Editor default

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab bar at top of viewport area per D-05 */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
            activeTab === 'editor'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
            activeTab === 'preview'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Preview
        </button>
      </div>
      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'editor' ? editorContent : previewContent}
      </div>
    </div>
  )
}
