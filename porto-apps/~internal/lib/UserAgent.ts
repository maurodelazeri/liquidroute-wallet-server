export interface UserAgentInfo {
  isMobile: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
  isFirefox: boolean
}

export function parse(userAgent?: string): UserAgentInfo {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  
  return {
    isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(ua),
    isDesktop: !/Mobile|Android|iPhone|iPad|iPod/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isSafari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
    isChrome: /Chrome/i.test(ua),
    isFirefox: /Firefox/i.test(ua)
  }
}

export const UserAgent = {
  parse
}