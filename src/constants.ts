export const DEFAULT_OVERSCAN = 3; // Extra items rendered above/below the viewport.
export const SCROLL_CONVERGED_THRESHOLD = 0.5; // Physical px within which two scroll positions count as equal.
export const SETTLE_QUIET_FRAMES = 3; // Consecutive frames with no tree updates required before release.
export const SETTLE_MAX_FRAMES = 180; // Settle timeout in frames (~3s at 60fps), then release unconditionally.
export const SETTLE_WINDOW = 40; // Items rendered on each side of the target while settling.
