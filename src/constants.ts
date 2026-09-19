export const DEFAULT_OVERSCAN = 3; // Extra items rendered above/below the viewport.
export const SCROLL_CONVERGED_THRESHOLD = 0.5; // Physical px within which two scroll positions count as equal.
export const MAX_SETTLE_REJUMPS = 3; // Re-jumps when the target misses the viewport; then release best-effort.
export const SETTLE_MAX_FRAMES = 180; // Settle timeout in frames (~3s at 60fps), then release unconditionally.
