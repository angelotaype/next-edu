'use client'

interface MobileHeaderProps {
  onMenuClick: () => void
  schoolName?: string
  userName?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'NE'
}

export default function MobileHeader({
  onMenuClick,
  schoolName = 'Next Edu',
  userName = 'Usuario',
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{schoolName}</p>
            <p className="truncate text-xs text-gray-500">Panel operativo</p>
          </div>
        </div>

        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
          {getInitials(userName)}
        </div>
      </div>
    </header>
  )
}
