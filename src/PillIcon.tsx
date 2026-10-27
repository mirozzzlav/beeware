import tokens from './tokens.json'

export default function PillIcon({ color }: { color: 'blue' | 'red' }) {
  const blue = color === 'blue'
  return (
    <svg
      className="pill-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g transform="rotate(35 12 12)">
        <rect
          x="7"
          y="2"
          width="10"
          height="20"
          rx="5"
          fill={blue ? tokens['palette-blue-500'] : tokens['palette-red-500']}
        />
        <path
          d="M7 12h10v5a5 5 0 0 1-10 0v-5Z"
          fill={blue ? tokens['palette-blue-700'] : tokens['palette-red-700']}
        />
        <path
          d="M7 12h10"
          stroke={blue ? tokens['palette-blue-800'] : tokens['palette-red-800']}
          strokeWidth={tokens['stroke-width-thin']}
        />
        <path
          d="M9.5 8V7a2.5 2.5 0 0 1 2.5-2.5"
          stroke={blue ? tokens['palette-blue-200'] : tokens['palette-red-200']}
          strokeWidth={tokens['stroke-width-highlight']}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
