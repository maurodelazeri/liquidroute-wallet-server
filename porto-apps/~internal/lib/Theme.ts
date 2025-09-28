export type TailwindCustomTheme = {
  colorScheme: 'light' | 'dark'
  tailwindCss: string
}

export type TailwindThemeMapping = [string, string, string]

export const tailwindThemeMappings: TailwindThemeMapping[] = []

/** Formats a JSON theme string into a Tailwind theme declaration */
export function parseJsonTheme(
  jsonTheme: string,
  mappings: TailwindThemeMapping[] = tailwindThemeMappings,
): TailwindCustomTheme {
  const theme: any = JSON.parse(jsonTheme)

  if (typeof theme !== 'object' || theme === null) {
    throw new Error('Invalid theme JSON: must be a non-null object')
  }

  if (!('colorScheme' in theme)) {
    throw new Error('Invalid theme JSON: missing colorScheme')
  }

  let css = ''
  for (const [name, tailwindVar, type] of mappings) {
    const value = theme[name]
    if (value !== undefined)
      css += `\n    ${tailwindVar}: ${formatCssValue(value, type, theme.colorScheme)};`
  }

  return {
    colorScheme: theme.colorScheme,
    tailwindCss: `@layer theme {\n  :root, :host {${css}\n  }\n}`,
  }
}

function formatCssValue(value: unknown, type: string, colorScheme: string): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  return ''
}

// Export as namespace for compatibility  
export const Theme = {
  parseJsonTheme,
  tailwindThemeMappings
}