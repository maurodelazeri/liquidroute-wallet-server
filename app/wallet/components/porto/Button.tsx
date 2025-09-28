import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonSize = 'small' | 'medium' | 'large'

const buttonStyles = {
  base: {
    alignItems: 'center',
    backgroundColor: 'var(--button-bg)',
    border: '1px solid transparent',
    borderColor: 'var(--button-bd)',
    borderRadius: 'var(--radius-th_medium, 8px)',
    cursor: 'pointer',
    display: 'inline-flex',
    flex: '0 0 auto',
    justifyContent: 'center',
    touchAction: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  sizes: {
    small: {
      borderRadius: 6,
      fontSize: 13,
      height: 28,
      paddingLeft: 8,
      paddingRight: 8,
    },
    medium: {
      borderRadius: 8,
      fontSize: 15,
      height: 38,
      paddingLeft: 16,
      paddingRight: 16,
    },
    large: {
      borderRadius: 21,
      fontSize: 16,
      height: 42,
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  variants: {
    primary: {
      '--button-bd': '#6366f1',
      '--button-bg': '#6366f1',
      color: 'white',
    },
    secondary: {
      '--button-bd': 'rgba(0, 0, 0, 0.1)',
      '--button-bg': 'rgba(0, 0, 0, 0.05)',
      color: 'inherit',
    },
    distinct: {
      '--button-bd': '#22c55e',
      '--button-bg': '#22c55e',
      color: 'white',
    },
    negative: {
      '--button-bd': '#ef4444',
      '--button-bg': '#ef4444',
      color: 'white',
    },
    'negative-secondary': {
      '--button-bd': 'rgba(239, 68, 68, 0.2)',
      '--button-bg': 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
    },
    positive: {
      '--button-bd': '#22c55e',
      '--button-bg': '#22c55e',
      color: 'white',
    },
    strong: {
      '--button-bd': 'black',
      '--button-bg': 'black',
      color: 'white',
      fontWeight: 600,
    },
    content: {
      '--button-bd': 'transparent',
      '--button-bg': 'transparent',
      color: 'currentColor',
    },
    disabled: {
      '--button-bd': 'rgba(0, 0, 0, 0.05)',
      '--button-bg': 'rgba(0, 0, 0, 0.02)',
      color: 'rgba(0, 0, 0, 0.3)',
      cursor: 'not-allowed',
    },
  }
} as const

export function Button({
  children,
  className,
  disabled,
  icon,
  loading,
  shape = 'normal',
  size = 'medium',
  variant = 'secondary',
  width = 'auto',
  type = 'button',
  style,
  ...props
}: Button.Props) {
  if (loading === true) loading = 'Loading…'

  const sizeStyles = buttonStyles.sizes[typeof size === 'string' ? size : 'medium']
  const variantStyles = disabled 
    ? buttonStyles.variants.disabled 
    : buttonStyles.variants[variant]

  const widthStyles = 
    width === 'full' ? { width: '100%' } :
    width === 'grow' ? { flexGrow: 1 } :
    typeof width === 'number' ? { width } :
    {}

  const shapeStyles = shape === 'square' ? {
    aspectRatio: 1,
    padding: 0,
    width: 'auto',
  } : {}

  return (
    <button
      className={className}
      disabled={Boolean(loading) || disabled}
      type={type}
      {...props}
      style={{
        ...buttonStyles.base,
        ...sizeStyles,
        ...variantStyles,
        ...widthStyles,
        ...shapeStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '0.9'
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1'
        props.onMouseLeave?.(e)
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(1px)'
        }
        props.onMouseDown?.(e)
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        props.onMouseUp?.(e)
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: size === 'small' ? 6 : 8,
          height: '100%',
        }}
      >
        {loading ? (
          <>
            <Spinner size={size === 'small' ? 'small' : 'medium'} />
            {loading}
          </>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </div>
    </button>
  )
}

export namespace Button {
  export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode
    loading?: boolean | ReactNode
    size?: ButtonSize | Record<string, ButtonSize>
    shape?: 'normal' | 'square'
    variant?:
      | 'content'
      | 'distinct'
      | 'negative'
      | 'negative-secondary'
      | 'positive'
      | 'primary'
      | 'secondary'
      | 'strong'
    width?: 'auto' | 'full' | 'grow' | number | undefined
  }
}
