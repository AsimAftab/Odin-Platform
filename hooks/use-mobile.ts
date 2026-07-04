import * as React from "react"

const MOBILE_BREAKPOINT = 768

// useSyncExternalStore reads the current viewport width and subscribes to
// changes without ever calling setState inside an effect (which the lint rule
// flags for cascading renders). The server snapshot returns false so SSR and
// the first client render agree.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false
  )
}
