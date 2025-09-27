// Exact copy of Porto's Layout components
import { StringFormatter } from '@/lib/utils/StringFormatter'

export function Layout(props: Layout.Props) {
  return (
    <div className="liquidroute-dialog">
      {props.children}
    </div>
  )
}

export namespace Layout {
  export type Props = {
    children?: React.ReactNode | undefined
  }

  export function Header(props: Header.Props) {
    return (
      <div className="liquidroute-frame-bar">
        {props.children}
      </div>
    )
  }

  export namespace Header {
    export type Props = {
      children: React.ReactNode
      className?: string
    }
  }

  export function Content(props: Content.Props) {
    return (
      <div className="liquidroute-content">
        {props.children}
      </div>
    )
  }

  export namespace Content {
    export type Props = {
      children: React.ReactNode
    }
  }

  export function Footer(props: Footer.Props) {
    return (
      <div className={`liquidroute-footer ${props.className || ''}`}>
        {props.children}
      </div>
    )
  }

  export namespace Footer {
    export type Props = {
      children: React.ReactNode
      className?: string
    }

    // Actions Footer
    export function Actions(props: Actions.Props) {
      return <div className="flex w-full gap-2 px-3">{props.children}</div>
    }

    export namespace Actions {
      export type Props = {
        children: React.ReactNode
      }
    }

    // Account Footer - EXACTLY like Porto
    export function Account(props: Account.Props) {
      const { onClick } = props
      const address = props.address
      return (
        <div className="flex h-full w-full items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2.5">
          <div className="text-[13px] text-gray-500 dark:text-gray-400">Account</div>

          <button
            className="-my-1 -mx-2 flex items-center gap-1.5 rounded-lg px-2 py-1 hover:not-disabled:bg-gray-100 dark:hover:not-disabled:bg-gray-800"
            disabled={!onClick}
            onClick={onClick}
            type="button"
          >
            <div
              className="font-medium text-[14px] text-gray-900 dark:text-gray-100"
              title={address}
            >
              {StringFormatter.truncate(address, { end: 6, start: 8 })}
            </div>
            {onClick && (
              <svg 
                className="w-4 h-4 text-gray-500 dark:text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      )
    }

    export namespace Account {
      export type Props = {
        address: string
        onClick?: () => void
      }
    }
  }
}
