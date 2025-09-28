import type { ReactNode } from 'react'
import { Screen } from './Screen'
import { Button } from './Button'

export function Layout(props: Layout.Props) {
  return <Screen {...props} />
}

export namespace Layout {
  export type Props = {
    children?: ReactNode | undefined
    layout?: 'compact' | 'full'
  }

  export function Header(props: Header.Props) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 12px 8px',
        ...props.style
      }}>
        {props.children}
      </div>
    )
  }

  export namespace Header {
    export type Props = {
      children: ReactNode
      style?: React.CSSProperties
    }

    export function Default(props: Default.Props) {
      const { icon: Icon, title, content, subContent, variant = 'info' } = props
      
      const variantColors = {
        info: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' },
        success: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
        warning: { bg: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' },
        error: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...variantColors[variant]
              }}>
                <Icon style={{ width: 18, height: 18 }} />
              </div>
            )}
            <div style={{ fontWeight: 500, fontSize: 18 }}>{title}</div>
          </div>
          {(content || subContent) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {content && (
                <div style={{ fontSize: 15, color: 'rgba(0, 0, 0, 0.8)' }}>
                  {content}
                </div>
              )}
              {subContent && (
                <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.5)' }}>
                  {subContent}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    export namespace Default {
      export type Props = {
        icon?: React.ComponentType<any>
        title: ReactNode
        content?: ReactNode
        subContent?: ReactNode
        variant?: 'info' | 'success' | 'warning' | 'error'
      }
    }
  }

  export namespace Footer {
    export function Actions(props: Actions.Props) {
      const { children, style } = props
      
      return (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '16px 12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          ...style
        }}>
          {children}
        </div>
      )
    }

    export namespace Actions {
      export type Props = {
        children: ReactNode
        style?: React.CSSProperties
      }
    }

    export function Account(props: Account.Props) {
      const { address, onPress, style } = props
      
      const formatAddress = (addr: string) => {
        if (addr.length <= 10) return addr
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
      }

      return (
        <button
          onClick={onPress}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.15s',
            ...style
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 600
            }}>
              {address.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {formatAddress(address)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.5)' }}>
                Connected Account
              </div>
            </div>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'rgba(0, 0, 0, 0.4)' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )
    }

    export namespace Account {
      export type Props = {
        address: string
        onPress?: () => void
        style?: React.CSSProperties
      }
    }
  }
}
