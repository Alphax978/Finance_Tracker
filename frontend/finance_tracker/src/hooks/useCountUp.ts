import { useEffect, useState } from 'react'

export const useCountUp = (target: number, duration = 700) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const from = 0
    const startTime = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return value
}
