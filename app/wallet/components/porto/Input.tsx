import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, Input.Props>(
  function Input(
    {
      disabled,
      label,
      size = 'medium',
      variant = 'default',
      error,
      ...props
    },
    ref,
  ) {
    const sizeStyles = {
      small: {
        fontSize: 14,
        height: 32,
        padding: '0 12px',
      },
      medium: {
        fontSize: 15,
        height: 42,
        padding: '0 16px',
      },
      large: {
        fontSize: 16,
        height: 52,
        padding: '0 20px',
      },
    }

    const inputStyles: React.CSSProperties = {
      backgroundColor: variant === 'ghost' ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
      border: error ? '1px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: 8,
      color: disabled ? 'rgba(0, 0, 0, 0.4)' : 'inherit',
      cursor: disabled ? 'not-allowed' : 'text',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'all 0.15s',
      width: '100%',
      ...sizeStyles[size],
    }

    const containerStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
    }

    const labelStyles: React.CSSProperties = {
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 4,
    }

    const errorStyles: React.CSSProperties = {
      color: '#ef4444',
      fontSize: 13,
      marginTop: 4,
    }

    return (
      <div style={containerStyles}>
        {label && <label style={labelStyles}>{label}</label>}
        <input
          ref={ref}
          disabled={disabled}
          style={inputStyles}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = '#6366f1'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.boxShadow = 'none'
            props.onBlur?.(e)
          }}
          {...props}
        />
        {error && <div style={errorStyles}>{error}</div>}
      </div>
    )
  },
)

export namespace Input {
  export interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string
    size?: 'small' | 'medium' | 'large'
    variant?: 'default' | 'ghost'
    error?: string
  }
}
