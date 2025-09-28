import type { ReactNode } from 'react'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const FrameContext = createContext<Frame.Context | null>(null)

export function Frame({
  children,
  colorScheme = 'light dark',
  mode: mode_ = 'dialog',
  onClose,
  onHeight,
  site,
  visible = true,
}: Frame.Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [large, setLarge] = useState(false)

  // Check window width for responsive behavior
  useEffect(() => {
    const checkSize = () => {
      if (frameRef.current) {
        setLarge(frameRef.current.offsetWidth >= 480)
      }
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const mode = useMemo<Frame.ModeResolved>(() => {
    const mode: Frame.Mode =
      typeof mode_ === 'string'
        ? { name: mode_, variant: 'auto' as const }
        : { ...mode_ }

    if (mode.name === 'dialog' && mode.variant === 'auto')
      return { name: 'dialog', variant: large ? 'floating' : 'drawer' } as Frame.ModeResolved

    if (mode.name === 'full' && mode.variant === 'auto')
      return { name: 'full', variant: large ? 'large' : 'medium' } as Frame.ModeResolved

    if (mode.variant === 'auto')
      return { name: 'dialog', variant: 'floating' } as Frame.ModeResolved

    return mode as Frame.ModeResolved
  }, [mode_, large])

  const contextValue = useMemo<Frame.Context>(() => {
    if (mode.name === 'full')
      return { colorScheme, mode: 'full', variant: mode.variant }
    if (mode.name === 'dialog')
      return { colorScheme, mode: 'dialog', variant: mode.variant }
    return { colorScheme, mode: 'dialog', variant: 'floating' }
  }, [colorScheme, mode])

  useEffect(() => {
    if (!onClose) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const frameStyles: React.CSSProperties = {
    display: 'grid',
    height: '100%',
    placeItems: 'center',
    width: '100%',
    colorScheme,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const dialogStyles: React.CSSProperties = {
    animation: visible ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.2s ease-out',
    backgroundColor: 'white',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: mode.variant === 'drawer' ? '24px 24px 0 0' : '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: mode.variant === 'drawer' ? '85vh' : '90vh',
    maxWidth: '500px',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  }

  const headerStyles: React.CSSProperties = {
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    height: 52,
    justifyContent: 'space-between',
    padding: '0 20px',
    flexShrink: 0,
  }

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  }

  return (
    <FrameContext.Provider value={contextValue}>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(10px);
          }
        }
      `}</style>
      <div ref={frameRef} style={frameStyles}>
        <div style={dialogStyles}>
          {mode.name === 'dialog' && onClose && (
            <div style={headerStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {site?.icon && (
                  <img
                    src={site.icon}
                    alt={site.name || ''}
                    style={{ width: 24, height: 24, borderRadius: 8 }}
                  />
                )}
                <div>
                  {site?.name && (
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {site.name}
                    </div>
                  )}
                  {site?.verified && (
                    <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Verified
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
          <div style={contentStyles}>
            {children}
          </div>
        </div>
      </div>
    </FrameContext.Provider>
  )
}

Frame.useFrame = function useFrame(throwOnNull = false): Frame.Context | null {
  const context = useContext(FrameContext)
  if (throwOnNull && !context) {
    throw new Error('Frame.useFrame must be used within a Frame')
  }
  return context
}

export namespace Frame {
  export type ModeName = 'dialog' | 'full'
  export type ModeVariantName = 'auto' | 'content-height' | 'drawer' | 'floating' | 'large' | 'medium'
  
  export type Mode =
    | ModeName
    | { name: ModeName; variant: ModeVariantName }

  export type ModeResolved =
    | { name: 'dialog'; variant: 'drawer' | 'floating' }
    | { name: 'full'; variant: 'content-height' | 'large' | 'medium' }

  export interface Context {
    colorScheme: string
    mode: ModeName
    variant: ModeVariantName
  }

  export interface Props {
    children: ReactNode
    colorScheme?: string
    mode?: Mode
    onClose?: () => void
    onHeight?: (height: number) => void
    site?: {
      icon?: string
      name?: string
      verified?: boolean
    }
    visible?: boolean
  }
}
