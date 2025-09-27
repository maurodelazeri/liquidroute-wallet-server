'use client'

import React, { ReactNode, useEffect, useRef } from 'react'

interface FrameProps {
  children: ReactNode
  mode?: 'dialog' | 'full'
  variant?: 'floating' | 'drawer' | 'auto'
  onClose?: () => void
  site: {
    label: string
    icon?: string
    verified?: boolean
    tag?: string
  }
  visible?: boolean
}

export function Frame({
  children,
  mode = 'dialog',
  variant = 'auto',
  onClose,
  site,
  visible = true
}: FrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [resolvedVariant, setResolvedVariant] = React.useState<'floating' | 'drawer'>('floating')

  useEffect(() => {
    const updateVariant = () => {
      if (variant === 'auto' && frameRef.current) {
        const width = frameRef.current.offsetWidth
        setResolvedVariant(width >= 480 ? 'floating' : 'drawer')
      } else if (variant !== 'auto') {
        setResolvedVariant(variant as 'floating' | 'drawer')
      }
    }

    updateVariant()
    window.addEventListener('resize', updateVariant)
    return () => window.removeEventListener('resize', updateVariant)
  }, [variant])

  useEffect(() => {
    if (!onClose) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!visible) return null

  return (
    <div 
      className="porto-frame" 
      data-dialog={resolvedVariant}
      ref={frameRef}
    >
      <div className="porto-frame-container">
        {mode === 'dialog' && (
          <div className="porto-overlay" onClick={onClose} />
        )}
        <div 
          className="porto-dialog" 
          data-variant={resolvedVariant}
        >
          <div className="porto-frame-bar">
            <div className="porto-frame-bar-content">
              {site.icon && (
                <div className="porto-frame-bar-icon">
                  <img 
                    src={site.icon} 
                    alt="" 
                    width={20} 
                    height={20}
                  />
                </div>
              )}
              <div>{site.label}</div>
              {site.verified && (
                <svg 
                  className="porto-icon-sm" 
                  style={{ color: 'var(--color-th_accent)' }}
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2Z" />
                </svg>
              )}
              {site.tag && (
                <div className="porto-badge">{site.tag}</div>
              )}
            </div>
            {onClose && (
              <button 
                className="porto-frame-bar-close"
                onClick={onClose}
                type="button"
                aria-label="Close"
              >
                <svg 
                  className="porto-icon-sm"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <div className="porto-content">
            <div className="porto-content-inner">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ScreenProps {
  children: ReactNode
  className?: string
}

export function Screen({ children, className = '' }: ScreenProps) {
  return (
    <div className={`porto-screen ${className}`}>
      {children}
    </div>
  )
}
