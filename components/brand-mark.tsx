import type { SVGProps } from 'react'

/** TERKASA's T monogram; inherits the existing brand color and layout. */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3 4h18v5h-6.5v12h-5V9H3V4Z" />
    </svg>
  )
}
