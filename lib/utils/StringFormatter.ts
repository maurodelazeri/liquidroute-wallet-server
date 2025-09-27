// Exact copy of Porto's StringFormatter
export namespace StringFormatter {
  export function truncate(
    str: string,
    { start = 8, end = 6 }: { start?: number; end?: number } = {},
  ) {
    if (str.length <= start + end) return str
    return `${str.slice(0, start)}\u2026${str.slice(-end)}`
  }
}

export namespace AddressFormatter {
  export function shorten(address: string, chars = 4) {
    return address.length < chars * 2 + 2
      ? address
      : address.slice(0, chars + 2) + '…' + address.slice(-chars)
  }
}
