import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Frame } from './Frame'

export function Screen({
  children,
  layout,
  bottomAction,
  compactPadding = false,
}: Screen.Props) {
  const frame = Frame.useFrame()
  layout ??= frame?.mode === 'dialog' ? 'compact' : 'full'

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    width: '100%',
    ...(layout === 'compact' && {
      minHeight: 0,
    }),
    ...(layout === 'full' && {
      flex: '1 1 auto',
      minHeight: 120,
      overflowY: 'auto',
    }),
  }

  const innerStyles: React.CSSProperties = {
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
    width: '100%',
  }

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    ...(layout === 'full' && {
      flex: '1 1 auto',
      padding: 12,
    }),
    ...(layout === 'compact' && compactPadding && {
      padding: 16,
    }),
  }

  return (
    <div style={containerStyles}>
      <div style={innerStyles}>
        <div style={contentStyles}>
          {children}
          {bottomAction && (
            <ScreenBottomAction layout={layout} {...bottomAction} />
          )}
        </div>
      </div>
    </div>
  )
}

function ScreenHeader({ content, icon, layout, title }: Screen.HeaderProps) {
  const frame = Frame.useFrame()
  layout ??= frame?.mode === 'dialog' ? 'compact' : 'full'

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    lineHeight: 1.5,
    ...(layout === 'compact' && {
      paddingBottom: 8,
    }),
    ...(layout === 'full' && {
      flex: '1 0 auto',
      justifyContent: 'center',
      paddingBottom: 40,
    }),
  }

  const titleContainerStyles: React.CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    ...(layout === 'compact' && {
      gap: 8,
    }),
    ...(layout === 'full' && {
      flexDirection: 'column',
      gap: 16,
    }),
  }

  const iconStyles: React.CSSProperties = {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '50%',
    color: '#6366f1',
    display: 'grid',
    overflow: 'hidden',
    placeItems: 'center',
    ...(layout === 'compact' && { height: 32, width: 32 }),
    ...(layout === 'full' && { height: 64, width: 64 }),
  }

  const titleStyles: React.CSSProperties = {
    ...(layout === 'compact' && { fontSize: 18 }),
    ...(layout === 'full' && { fontSize: 28 }),
    fontWeight: 600,
  }

  const contentStyles: React.CSSProperties = {
    ...(layout === 'compact' && {
      fontSize: 15,
      textAlign: 'left',
    }),
    ...(layout === 'full' && {
      fontSize: 18,
      textAlign: 'center',
    }),
    color: 'rgba(0, 0, 0, 0.6)',
  }

  return (
    <div style={headerStyles}>
      <div style={titleContainerStyles}>
        {icon && (
          <div style={iconStyles}>
            {icon}
          </div>
        )}
        <div style={titleStyles}>
          {title}
        </div>
      </div>
      {content && (
        <div style={contentStyles}>
          {content}
        </div>
      )}
    </div>
  )
}

function ScreenBottomAction({
  children,
  layout,
  onClick,
  ...props
}: Screen.BottomActionProps) {
  const buttonStyles: React.CSSProperties = {
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: 0,
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
    fontWeight: 500,
    justifyContent: 'space-between',
    padding: 12,
    transition: 'background 0.15s',
    width: '100%',
    ...(layout === 'full' && {
      borderRadius: 8,
      marginTop: 12,
    }),
  }

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <button
        style={buttonStyles}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
        {...props}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
          {children}
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  )
}

export namespace Screen {
  export interface Props {
    bottomAction?: ButtonHTMLAttributes<HTMLButtonElement> | undefined
    children?: ReactNode
    layout?: Layout | undefined
    compactPadding?: boolean | undefined
  }

  export interface HeaderProps {
    content?: ReactNode
    icon?: ReactNode
    layout?: Layout | undefined
    title: string
  }

  export interface BottomActionProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    layout: Layout
  }

  export type Layout = 'compact' | 'full'

  export const Header = ScreenHeader
}
