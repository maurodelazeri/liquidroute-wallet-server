import React, { ReactNode, useEffect, useRef, useState } from 'react'

interface FrameProps {
  children: ReactNode
  colorScheme?: string
  mode?: { name: string; variant: string } | string
  onClose?: () => void
  site?: {
    icon?: any
    label?: ReactNode
    tag?: string
    verified?: boolean
  }
  visible?: boolean
  onHeight?: (height: number) => void
  screenKey?: string
}

export default function Frame({ 
  children,
  colorScheme = 'light dark',
  mode: mode_,
  onClose,
  site,
  visible = true
}: FrameProps) {
  const [large, setLarge] = useState(false)

  useEffect(() => {
    const updateSize = () => setLarge(window.innerWidth >= 480)
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const mode = typeof mode_ === 'string' 
    ? mode_ 
    : mode_?.name === 'dialog' 
      ? mode_.variant || (large ? 'floating' : 'drawer')
      : 'floating'

  const isFloating = mode === 'floating'
  const isDrawer = mode === 'drawer'

  if (!visible) return null

  return (
    <div 
      data-dialog="true"
      style={{
        containerType: 'inline-size',
        display: 'grid',
        height: '100%',
        placeItems: 'center',
        position: 'relative',
        width: '100%',
        background: 'transparent'
      }}
    >
      <div style={{
        display: 'grid',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        width: '100%',
        placeItems: isFloating ? 'start center' : 'end center'
      }}>
        {/* Porto's transparent overlay */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          inset: 0,
          position: 'fixed',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }} onClick={onClose} />
        
        {/* Porto's dialog card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: isDrawer ? '100%' : '360px',
          position: 'relative',
          width: '100%',
          backgroundColor: 'var(--background-color-th_base)',
          border: '1px solid var(--border-color-th_frame)',
          borderRadius: isDrawer ? '16px 16px 0 0' : 'var(--radius-th_frame)',
          flex: 1,
          overflow: 'hidden',
          maxWidth: isDrawer ? '100%' : '360px',
          top: isFloating ? '16px' : 'auto',
          bottom: isDrawer ? '0' : 'auto',
          animation: isFloating ? 'enter 150ms cubic-bezier(0.4, 0, 0.2, 1)' : 'slideUp 150ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Porto's frame bar */}
          <div style={{
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color-th_frame)',
            color: 'var(--text-color-th_frame)',
            display: 'flex',
            flex: '0 0 auto',
            justifyContent: 'space-between',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            width: '100%',
            backgroundColor: 'var(--background-color-th_frame)',
            height: '33px'
          }}>
            <div style={{
              alignItems: 'center',
              display: 'flex',
              flex: 1,
              minWidth: 0,
              paddingInline: '12px',
              gap: '8px',
              fontSize: '13px'
            }}>
              <div style={{
                borderRadius: 'var(--radius-th_small)',
                height: '20px',
                width: '20px',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }} />
              {site?.label || <div>LiquidRoute</div>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-color-th_frame)',
                  cursor: 'pointer',
                  display: 'flex',
                  height: '33px',
                  justifyContent: 'center',
                  padding: 0,
                  width: '33px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          {/* Content area */}
          <div style={{
            display: 'flex',
            flex: '1 0 auto',
            justifyContent: 'center',
            width: '100%',
            overflow: 'auto'
          }}>
            {children}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes enter {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
