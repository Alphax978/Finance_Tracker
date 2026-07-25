type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  label?: string
  size?: SpinnerSize
  inline?: boolean
}

const Spinner = ({ label, size = 'md', inline = false }: SpinnerProps) => {
  if (inline) {
    return <span className={`app-spinner app-spinner-${size} app-spinner-inline`} aria-hidden="true" />
  }

  return (
    <div className="app-spinner-wrap" role="status" aria-live="polite">
      <span className={`app-spinner app-spinner-${size}`} aria-hidden="true" />
      {label && <span className="app-spinner-label">{label}</span>}
    </div>
  )
}

export default Spinner
