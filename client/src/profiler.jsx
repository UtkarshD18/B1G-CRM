import { Profiler } from 'react'

const isProfilerEnabled = import.meta.env.VITE_ENABLE_REACT_PROFILER === 'true'

function logRenderMetrics(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  if (!isProfilerEnabled) {
    return
  }

  console.table([
    {
      id,
      phase,
      actualDuration: Number(actualDuration.toFixed(2)),
      baseDuration: Number(baseDuration.toFixed(2)),
      startTime: Number(startTime.toFixed(2)),
      commitTime: Number(commitTime.toFixed(2)),
    },
  ])
}

export function AppProfiler({ children }) {
  return (
    <Profiler id="AppRoot" onRender={logRenderMetrics}>
      {children}
    </Profiler>
  )
}
