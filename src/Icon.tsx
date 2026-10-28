import type { ComponentPropsWithoutRef } from 'react'

const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  submit: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  backspace: <path d="M9 5h12v14H9l-7-7 7-7Zm3 4 6 6m0-6-6 6" />,
  trash: <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />,
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </>
  ),
}

type IconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'children' | 'name'> & {
  name: keyof typeof paths
}

export default function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
