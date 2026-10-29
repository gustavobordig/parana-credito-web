const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconeCheck = ({ tamanho = 16 }: { tamanho?: number }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" strokeWidth={3} {...base}>
    <path d="M5 12l5 5L20 7" />
  </svg>
)

export const IconeTraco = ({ tamanho = 14 }: { tamanho?: number }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" strokeWidth={3} {...base}>
    <path d="M6 12h12" />
  </svg>
)

export const IconeX = ({ tamanho = 16 }: { tamanho?: number }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" strokeWidth={3} {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconeSeta = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth={2} {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconeBrilho = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth={2} {...base}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </svg>
)

export const Spinner = ({ tamanho = 18 }: { tamanho?: number }) => (
  <svg className="gira" width={tamanho} height={tamanho} viewBox="0 0 24 24" strokeWidth={3} {...base}>
    <path d="M21 12a9 9 0 1 1-9-9" />
  </svg>
)

export const Logo = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
    <rect width="34" height="34" rx="10" fill="#3366FF" />
    <rect x="9" y="15" width="16" height="9" rx="4.5" fill="#FFFFFF" />
  </svg>
)
