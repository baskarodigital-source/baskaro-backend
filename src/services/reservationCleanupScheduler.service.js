import { releaseExpiredReservations } from './inventoryReservation.service.js'

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000

function resolveIntervalMs() {
  const raw = Number(process.env.RESERVATION_CLEANUP_INTERVAL_MS)
  if (Number.isFinite(raw) && raw >= 30_000) return raw
  return DEFAULT_INTERVAL_MS
}

export function startReservationCleanupScheduler() {
  const disabled = String(process.env.RESERVATION_CLEANUP_DISABLED || '').toLowerCase() === 'true'
  if (disabled) {
    console.log('[ReservationCleanup] Scheduler disabled via RESERVATION_CLEANUP_DISABLED=true')
    return () => {}
  }

  const intervalMs = resolveIntervalMs()

  const run = async () => {
    try {
      await releaseExpiredReservations()
    } catch (err) {
      console.error('[ReservationCleanup] Failed to release expired reservations:', err?.message || err)
    }
  }

  // Fire once at startup so stale holds are cleaned even before the first interval.
  run()
  const timer = setInterval(run, intervalMs)
  console.log(`[ReservationCleanup] Scheduler started (interval: ${intervalMs}ms)`)

  return () => {
    clearInterval(timer)
    console.log('[ReservationCleanup] Scheduler stopped')
  }
}
