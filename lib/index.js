var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
const useLatest = (value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};
class FenwickTree {
  constructor(sizes) {
    __publicField(this, "tree");
    __publicField(this, "n");
    __publicField(this, "logn");
    this.n = sizes.length;
    this.tree = new Float64Array(this.n + 1);
    for (let i = 0; i < this.n; i++)
      this.tree[i + 1] = sizes[i];
    for (let x = 1; x <= this.n; x++) {
      const parent = x + (x & -x);
      if (parent <= this.n)
        this.tree[parent] += this.tree[x];
    }
    this.logn = this.n > 0 ? Math.floor(Math.log2(this.n)) : 0;
  }
  update(i, delta) {
    for (let x = i + 1; x <= this.n; x += x & -x)
      this.tree[x] += delta;
  }
  prefixSum(i) {
    let sum = 0;
    for (let x = i; x > 0; x -= x & -x)
      sum += this.tree[x];
    return sum;
  }
  total() {
    return this.prefixSum(this.n);
  }
  findByPrefixSum(target) {
    let pos = 0;
    let remaining = target;
    const EPS = 1e-6;
    for (let pw = 1 << this.logn; pw > 0; pw >>= 1) {
      const next = pos + pw;
      if (next <= this.n && this.tree[next] <= remaining + EPS) {
        pos = next;
        remaining -= this.tree[next];
      }
    }
    return pos;
  }
}
const DEFAULT_OVERSCAN = 3;
const SCROLL_CONVERGED_THRESHOLD = 0.5;
const SETTLE_QUIET_FRAMES = 3;
const SETTLE_MAX_FRAMES = 180;
const SETTLE_WINDOW = 40;
const DEFAULT_SIZE = 24;
const SAFE_MAX_HEIGHT = 15e6;
const getScale = (logicalTotal) => {
  if (logicalTotal <= SAFE_MAX_HEIGHT)
    return { scale: 1, physicalTotal: logicalTotal };
  return { scale: SAFE_MAX_HEIGHT / logicalTotal, physicalTotal: SAFE_MAX_HEIGHT };
};
const getFenwickTree = (count, estimateSize) => {
  const sizes = new Float64Array(count);
  for (let i = 0; i < count; i++)
    sizes[i] = estimateSize?.(i) || DEFAULT_SIZE;
  return new FenwickTree(sizes);
};
const classifySettleScroll = (scrollTop, targetScrollTop, version, baseVersion) => {
  if (Math.abs(scrollTop - targetScrollTop) <= SCROLL_CONVERGED_THRESHOLD)
    return "converged";
  return version !== baseVersion ? "stale-tree" : "user";
};
const getViewportRange = (tree, logicalScrollOffset, containerHeight, scale, overscanValue, countValue) => {
  const viewportStart = tree.findByPrefixSum(logicalScrollOffset);
  const viewportEnd = tree.findByPrefixSum(logicalScrollOffset + containerHeight / scale);
  return {
    startIndex: Math.max(viewportStart - overscanValue, 0),
    endIndex: Math.min(viewportEnd + overscanValue + 1, countValue),
    viewportStart,
    viewportEnd
  };
};
const computeTargetScrollTop = (tree, index, align, containerHeight, scale, count, headerHeight = 0) => {
  const targetIndex = Math.max(0, Math.min(index, count - 1));
  const targetOffset = tree.prefixSum(targetIndex);
  const itemLogicalSize = tree.prefixSum(targetIndex + 1) - targetOffset;
  const visibleHeight = Math.max(containerHeight - headerHeight, 0);
  let logicalScrollOffset;
  switch (align) {
    case "center":
      logicalScrollOffset = targetOffset + (itemLogicalSize - visibleHeight / scale) / 2;
      break;
    case "end":
      logicalScrollOffset = targetOffset + itemLogicalSize - visibleHeight / scale;
      break;
    default:
      logicalScrollOffset = targetOffset;
  }
  return { targetScrollTop: Math.round(Math.max(0, logicalScrollOffset * scale - headerHeight)), logicalScrollOffset };
};
function useVirtualizer({ count, estimateSize, overscan = DEFAULT_OVERSCAN, headerHeight = 0 }) {
  const headerOffset = Math.max(headerHeight, 0);
  const [scrollOffset, setScrollOffset] = useState({ value: 0 });
  const [forcedRange, setForcedRange] = useState(null);
  const scrollElementRef = useRef(null);
  const [scrollElement, setScrollElement] = useState(null);
  const rafRef = useRef(null);
  const observersRef = useRef(/* @__PURE__ */ new Map());
  const containerObserverRef = useRef(null);
  const prevCountRef = useRef(count);
  const fenwickRef = useRef(null);
  const refCacheRef = useRef(/* @__PURE__ */ new Map());
  const countRef = useLatest(count);
  const overscanRef = useLatest(overscan);
  const pendingTargetRef = useRef(null);
  const tickRafRef = useRef(null);
  const settleFramesRef = useRef(0);
  const quietFramesRef = useRef(0);
  const treeVersionRef = useRef(0);
  const versionAtJumpRef = useRef(0);
  if (fenwickRef.current === null || !fenwickRef.current.total())
    fenwickRef.current = getFenwickTree(count, estimateSize);
  if (prevCountRef.current !== count) {
    const prevTree = fenwickRef.current;
    const prevCount = prevCountRef.current;
    const nextTree = getFenwickTree(count, estimateSize);
    if (prevTree && prevCount > 0) {
      const keep = Math.min(prevCount, count);
      for (let i = 0; i < keep; i++) {
        const delta = prevTree.prefixSum(i + 1) - prevTree.prefixSum(i) - (nextTree.prefixSum(i + 1) - nextTree.prefixSum(i));
        if (delta !== 0)
          nextTree.update(i, delta);
      }
    }
    fenwickRef.current = nextTree;
    prevCountRef.current = count;
  }
  const computeItems = useCallback(
    (physicalScrollOffset) => {
      const el = scrollElementRef.current;
      const tree = fenwickRef.current;
      if (!el || count === 0 || !tree)
        return { virtualItems: [], scrollHeight: 0 };
      const containerHeight = el.clientHeight;
      const logicalTotal = tree.total();
      const { scale, physicalTotal } = getScale(logicalTotal);
      const visibleHeight = Math.max(containerHeight - headerOffset, 0);
      const pendingTarget = pendingTargetRef.current;
      let logicalScrollOffset;
      if (pendingTarget !== null) {
        const { targetScrollTop, logicalScrollOffset: targetLogicalOffset } = computeTargetScrollTop(
          tree,
          pendingTarget.index,
          pendingTarget.align,
          containerHeight,
          scale,
          count,
          headerOffset
        );
        logicalScrollOffset = targetLogicalOffset;
        if (Math.abs(el.scrollTop - targetScrollTop) > SCROLL_CONVERGED_THRESHOLD) {
          el.scrollTop = targetScrollTop;
        }
      } else {
        logicalScrollOffset = (physicalScrollOffset + headerOffset) / scale;
      }
      let startIndex;
      let endIndex;
      if (forcedRange) {
        startIndex = forcedRange.start;
        endIndex = forcedRange.end;
      } else {
        const { startIndex: viewportStartIndex, endIndex: viewportEndIndex } = getViewportRange(
          tree,
          logicalScrollOffset,
          pendingTarget !== null ? containerHeight : visibleHeight,
          scale,
          overscan,
          count
        );
        startIndex = viewportStartIndex;
        endIndex = viewportEndIndex;
      }
      const startOffsetLogical = tree.prefixSum(startIndex);
      const startOffsetPhysical = (pendingTarget !== null ? logicalScrollOffset * scale : physicalScrollOffset + headerOffset) + (startOffsetLogical - logicalScrollOffset) * scale;
      const virtualItems2 = [];
      let offset = startOffsetPhysical;
      for (let i = startIndex; i < endIndex; i++) {
        const size = (tree.prefixSum(i + 1) - tree.prefixSum(i)) * scale;
        virtualItems2.push({ index: i, start: offset, size, end: offset + size });
        offset += size;
      }
      return { virtualItems: virtualItems2, scrollHeight: physicalTotal };
    },
    [count, forcedRange, overscan, headerOffset]
  );
  const observeItem = useCallback((index, element) => {
    if (typeof ResizeObserver === "undefined")
      return;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize[0]?.blockSize;
      if (height == null || !fenwickRef.current)
        return;
      const tree = fenwickRef.current;
      const { scale } = getScale(tree.total());
      const logicalHeight = height / scale;
      const prevSize = tree.prefixSum(index + 1) - tree.prefixSum(index);
      if (Math.abs(prevSize - logicalHeight) < 0.5)
        return;
      tree.update(index, logicalHeight - prevSize);
      treeVersionRef.current += 1;
      setScrollOffset((prevState) => ({ ...prevState }));
    });
    observer.observe(element);
    observersRef.current.set(index, { observer, element });
  }, []);
  const measureElement = useCallback(
    (element, index) => {
      if (!element) {
        const entry = observersRef.current.get(index);
        if (entry) {
          entry.observer.disconnect();
          observersRef.current.delete(index);
        }
        return;
      }
      const existing = observersRef.current.get(index);
      if (existing && existing.element === element)
        return;
      if (existing) {
        existing.observer.disconnect();
        observersRef.current.delete(index);
      }
      observeItem(index, element);
    },
    [observeItem]
  );
  const getMeasureRef = useCallback(
    (index) => {
      let fn = refCacheRef.current.get(index);
      if (!fn) {
        fn = (el) => {
          measureElement(el, index);
          if (el === null)
            refCacheRef.current.delete(index);
        };
        refCacheRef.current.set(index, fn);
      }
      return fn;
    },
    [measureElement]
  );
  const releaseSettle = useCallback((scrollTop) => {
    if (tickRafRef.current !== null) {
      cancelAnimationFrame(tickRafRef.current);
      tickRafRef.current = null;
    }
    pendingTargetRef.current = null;
    setForcedRange(null);
    setScrollOffset({ value: scrollTop });
  }, []);
  const scheduleTick = useCallback(() => {
    if (tickRafRef.current !== null)
      return;
    tickRafRef.current = requestAnimationFrame(() => {
      tickRafRef.current = null;
      const el = scrollElementRef.current;
      const tree = fenwickRef.current;
      const pending = pendingTargetRef.current;
      if (!el || !tree || !pending)
        return;
      const countValue = countRef.current;
      const overscanValue = overscanRef.current;
      settleFramesRef.current += 1;
      if (settleFramesRef.current > SETTLE_MAX_FRAMES) {
        releaseSettle(el.scrollTop);
        return;
      }
      const { scale } = getScale(tree.total());
      const { targetScrollTop } = computeTargetScrollTop(
        tree,
        pending.index,
        pending.align,
        el.clientHeight,
        scale,
        countValue,
        headerOffset
      );
      const kind = classifySettleScroll(
        el.scrollTop,
        targetScrollTop,
        treeVersionRef.current,
        versionAtJumpRef.current
      );
      if (kind === "user") {
        releaseSettle(el.scrollTop);
        return;
      }
      if (kind === "stale-tree") {
        versionAtJumpRef.current = treeVersionRef.current;
        quietFramesRef.current = 0;
        setScrollOffset((prevState) => ({ ...prevState }));
        scheduleTick();
        return;
      }
      if (treeVersionRef.current !== versionAtJumpRef.current) {
        versionAtJumpRef.current = treeVersionRef.current;
        quietFramesRef.current = 0;
      } else {
        quietFramesRef.current += 1;
      }
      if (quietFramesRef.current < SETTLE_QUIET_FRAMES) {
        scheduleTick();
        return;
      }
      const { startIndex, endIndex } = getViewportRange(
        tree,
        (el.scrollTop + headerOffset) / scale,
        Math.max(el.clientHeight - headerOffset, 0),
        scale,
        overscanValue,
        countValue
      );
      const targetIndex = Math.max(0, Math.min(pending.index, countValue - 1));
      if (targetIndex < startIndex || targetIndex > endIndex) {
        releaseSettle(el.scrollTop);
        return;
      }
      releaseSettle(el.scrollTop);
    });
  }, [releaseSettle, countRef, overscanRef, headerOffset]);
  const handleScroll = useCallback(() => {
    if (rafRef.current !== null)
      cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollElementRef.current;
      const tree = fenwickRef.current;
      if (!el || !tree)
        return;
      const pending = pendingTargetRef.current;
      if (pending !== null) {
        const { scale } = getScale(tree.total());
        const { targetScrollTop } = computeTargetScrollTop(
          tree,
          pending.index,
          pending.align,
          el.clientHeight,
          scale,
          countRef.current,
          headerOffset
        );
        const kind = classifySettleScroll(
          el.scrollTop,
          targetScrollTop,
          treeVersionRef.current,
          versionAtJumpRef.current
        );
        if (kind === "user") {
          releaseSettle(el.scrollTop);
          return;
        }
        if (kind === "stale-tree")
          versionAtJumpRef.current = treeVersionRef.current;
      }
      setScrollOffset({ value: el.scrollTop });
    });
  }, [releaseSettle, countRef, headerOffset]);
  const scrollRef = useCallback((element) => {
    scrollElementRef.current = element;
    setScrollElement(element);
    setScrollOffset(element ? { value: element.scrollTop } : { value: 0 });
  }, []);
  useEffect(() => {
    const el = scrollElement;
    const itemObservers = observersRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          setScrollOffset((prevState) => ({ ...prevState }));
        });
        observer.observe(el);
        containerObserverRef.current = observer;
      }
    }
    for (const [index, { element }] of Array.from(itemObservers))
      observeItem(index, element);
    return () => {
      if (rafRef.current !== null)
        cancelAnimationFrame(rafRef.current);
      if (tickRafRef.current !== null)
        cancelAnimationFrame(tickRafRef.current);
      el?.removeEventListener("scroll", handleScroll);
      containerObserverRef.current?.disconnect();
      containerObserverRef.current = null;
      itemObservers.forEach((entry) => entry.observer.disconnect());
    };
  }, [scrollElement, handleScroll, observeItem]);
  const { virtualItems, scrollHeight } = useMemo(
    () => computeItems(scrollOffset.value),
    [computeItems, scrollOffset]
  );
  const jumpToIndex = useCallback(
    (index, align) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (tickRafRef.current !== null) {
        cancelAnimationFrame(tickRafRef.current);
        tickRafRef.current = null;
      }
      settleFramesRef.current = 0;
      quietFramesRef.current = 0;
      pendingTargetRef.current = { index, align };
      versionAtJumpRef.current = treeVersionRef.current;
      const rangeStart = Math.max(index - SETTLE_WINDOW, 0);
      const rangeEnd = Math.min(index + SETTLE_WINDOW + 1, count);
      setForcedRange({ start: rangeStart, end: rangeEnd });
      setScrollOffset((prevState) => ({ ...prevState }));
      scheduleTick();
    },
    [count, scheduleTick]
  );
  const scrollToIndex = useCallback(
    (index, options) => {
      if (index < 0 || index >= count)
        return;
      jumpToIndex(index, options?.align ?? "start");
    },
    [count, jumpToIndex]
  );
  return { virtualItems: virtualItems ?? [], scrollHeight, scrollToIndex, scrollRef, getMeasureRef };
}
export {
  useVirtualizer
};
