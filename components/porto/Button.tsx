'use client'

import React, { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'negative' | 'positive' | 'strong' | 'distinct' | 'disabled'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean | string
  icon?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const loadingText = loading === true ? 'Loading...' : loading

  return (
    <button
      className={`porto-button ${variant} ${size} ${fullWidth ? 'full-width' : ''} ${className}`}
      disabled={disabled || !!loading}
      {...props}
    >
      <div className="porto-flex porto-flex-row porto-items-center porto-gap-1">
        {loading ? (
          <>
            <div className="porto-spinner" />
            {loadingText}
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
