import type { CSSProperties } from 'react'

export function Spinner({
  size = 'medium',
  color = 'currentColor',
}: Spinner.Props) {
  const sizeMap = {
    small: 14,
    medium: 20,
    large: 28,
  }

  const dimension = sizeMap[size]

  const spinnerStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    border: `2px solid ${color}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyle} aria-label="Loading" />
    </>
  )
}

export namespace Spinner {
  export interface Props {
    size?: 'small' | 'medium' | 'large'
    color?: string
  }
}
