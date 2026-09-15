# Clear virtualize

A React virtualization utility for rendering large lists with **dynamic, resizable item heights**, built around automatic DOM measurement and an internal layout cache.

Unlike traditional virtualized list libraries that rely on explicit item measurement APIs or fixed-size assumptions, this implementation works directly with ReactNode[] and continuously refines layout based on real DOM feedback.

## ⚙️ API

### `useVirtualizer` (hook)

A hook-based virtualizer for full control over rendering. Works with any data source — tables (react-table), plain lists, or custom components.

```tsx
import { useVirtualizer } from 'clear-virtualize';

const { virtualItems, scrollHeight, scrollRef, measureElement, scrollToIndex } = useVirtualizer({
  count: 100000,
  estimateSize: () => 44, // approximate average row height in px
  overscan: 10,
});
```

`estimateSize` returns a **rough average height** used for initial scroll calculations. It is **not** a fixed height — once rows mount, `measureElement` measures their real DOM size via ResizeObserver and overrides the estimate. Pass a value close to your expected average row height.

| Option        | Type                          | Description                                                                    |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `count`       | `number`                      | Total number of items                                                          |
| `estimateSize`| `(index: number) => number`   | Approximate average row height in px (overridden by real measurements at runtime) |
| `overscan`    | `number`                      | Extra items rendered above/below viewport (default: 3)                         |

| Return value    | Type | Description |
| --------------- | ---- | ----------- |
| `virtualItems`  | `VirtualItem[]` | Items to render: `{ index, start, size, end }` |
| `scrollHeight`  | `number` | Total scrollable height (px) |
| `scrollRef`     | `(el: HTMLElement \| null) => void` | Callback ref — attach to scroll container |
| `measureElement`| `(el: HTMLElement \| null, index: number) => void` | Attach to each row for dynamic height measurement |
| `scrollToIndex` | `(index, options?) => void` | Scroll to item (`align: 'start' \| 'center' \| 'end'`) |

#### Table with react-table

```tsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from 'clear-virtualize';

const Table = ({ data, columns }) => {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 44, // approximate average row height
    overscan: 10,
  });

  return (
    <div ref={rowVirtualizer.scrollRef} style={{ height: 500, overflow: 'auto' }}>
      <div style={{ position: 'relative', height: rowVirtualizer.scrollHeight }}>
        {rowVirtualizer.virtualItems.map(virtualRow => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              ref={el => rowVirtualizer.measureElement(el, virtualRow.index)}
              style={{
                position: 'absolute',
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
                width: '100%',
              }}
            >
              {row.getVisibleCells().map(cell => (
                <div key={cell.id} style={{ display: 'inline-block', padding: 8 }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

**Important:** do not set a fixed `height` on rows — let `measureElement` + ResizeObserver measure the actual height. Use `transform: translateY(...)` for positioning.

#### Dynamic row height (expand/collapse)

`measureElement` uses ResizeObserver under the hood. When a row's height changes (e.g. user expands a row), positions of all subsequent rows are recalculated automatically:

```tsx
const [expanded, setExpanded] = useState({});

// In the table setup:
const table = useReactTable({
  data, columns,
  state: { expanded },
  onExpandedChange: old => setExpanded(old),
  getExpandedRowModel: getCoreRowModel(),
  getCoreRowModel: getCoreRowModel(),
});

// In the row renderer:
<div ref={el => rowVirtualizer.measureElement(el, virtualRow.index)}>
  <div style={{ display: 'flex' }}>
    {row.getVisibleCells().map(cell => /* ... */)}
  </div>
  {row.getIsExpanded() && (
    <div>Expanded content here — height is measured automatically</div>
  )}
</div>
```

#### Plain list

```tsx
const items = Array.from({ length: 100000 }, (_, i) => `Item ${i}`);

const List = () => {
  const { virtualItems, scrollHeight, scrollRef, measureElement } = useVirtualizer({
    count: items.length,
    estimateSize: () => 40,
    overscan: 5,
  });

  return (
    <div ref={scrollRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ position: 'relative', height: scrollHeight }}>
        {virtualItems.map(virtualRow => (
          <div
            key={virtualRow.index}
            ref={el => measureElement(el, virtualRow.index)}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
            }}
          >
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### `<Virtualize />` (component)

A container component that virtualizes a list of ReactNode elements with dynamic height support.

| Prop        | Type                      | Description                                                                                |
| ----------- | ------------------------- |--------------------------------------------------------------------------------------------|
| `children`  | `ReactNode[]`             | List of items to be virtualized                                                            |
| `height`    | `CSSProperties['height']` | Height of the scroll container                                                             |
| `width`     | `CSSProperties['width']`  | Optional width of the scroll container                                                     |
| `className` | `string`                  | Optional class name for container                                                          |
| `style`     | `CSSProperties`           | Additional inline styles                                                                   |
| `overScan`  | `number`                  | Number of extra items rendered above and below the visible viewport for smoother scrolling |

### 📏 Default behavior
If overScan is not provided, a default internal value is used.
Items are measured automatically via ResizeObserver.
Layout is recalculated incrementally as items mount or change size.

### 🧠 Notes
children are treated as a static array structure (ReactNode[]), not a render-prop stream.
Virtualization is driven by scroll position + internal offset cache.
Item sizes are not required upfront — they are inferred at runtime.

## 🚀 Key Features

### ⚡ Zero-config virtualization

No item render functions, no size estimators, no manual measurement hooks required.

Just pass:

```tsx
import Virtualize from 'clear-virtualize';

<Virtualize height={500} width={400}>
  {items.map(item => <div>{item}</div>)}
</Virtualize>
```

### 📏 Dynamic height support

List items can change height at any time (expansion, collapse, async content loading, etc.).

The system automatically:

- measures elements via ResizeObserver
- updates internal offsets incrementally
- repositions affected rows without full recomputation

### 🧠 Self-adjusting layout model

Instead of assuming fixed item size, the library maintains:

- a per-row offset cache
- an evolving average row height estimate
- incremental correction when real DOM measurements arrive

This allows the list to remain stable even when item heights are initially unknown or heterogeneous.

### 🔄 Incremental layout correction

When item size changes:

- only affected offsets are updated
- downstream rows are adjusted incrementally
- no full list reflow is required

This keeps scroll behavior smooth even under frequent resize events.

### 📦 ReactNode-first API

The library works directly with React elements:

- no render-prop abstraction
- no item renderer indirection layer
- no external data normalization required

### 🧪 Performance characteristics

Designed to handle:

- 100,000–400,000 items
- rapid scroll wheel / trackpad flicking
- scrollbar drag scrolling
- dynamic DOM height changes

Rendering is strictly bounded to the visible viewport plus overscan region.

### 🧩 Internal model (high level)

The virtualization logic is based on three core structures:

Offset cache — stores cumulative positions of measured rows
Height registry — stores observed DOM heights per index
Estimated row height — used for unmeasured items

As elements mount and resize, estimates are progressively replaced with real measurements, improving layout accuracy over time.

### 📌 Design philosophy

This library prioritizes:

- simplicity of integration
- correctness under dynamic UI changes
- minimal API surface
- DOM-driven layout truth (not pre-declared sizes)

The goal is to make virtualization behave like a natural extension of React rendering, rather than a separate abstraction layer.

### ⚠️ Trade-offs

This approach intentionally:

- keeps ReactNode creation outside the virtualizer (for API simplicity)
- relies on runtime measurement instead of precomputed layout
- uses heuristic-based estimation for initial render pass

These trade-offs favor developer experience and adaptability over strict theoretical optimality.

### ❓ Why not use existing solutions?

There are several well-established virtualization libraries in the React ecosystem, such as React Window and TanStack Virtual. They are powerful, battle-tested, and suitable for most production use cases.

This library does not aim to replace them. It takes a different approach in a few specific areas.

### 🧩 1. Simpler mental model

Most virtualization libraries require the developer to think in terms of:

item count
item renderer function
explicit measurement or estimation logic
layout configuration (fixed/variable size modes)

This library removes that abstraction layer.

You work directly with:

- ReactNode[] → virtualized rendering

- No render-prop layer, no explicit size model setup.

- The goal is to reduce the conceptual distance between “React rendering” and “virtualized rendering”.

### 📏 2. No explicit size management API

Traditional libraries usually require one of:

- fixed item height
- estimateSize function
- manual measurement hooks

This library instead:

- measures DOM nodes automatically via ResizeObserver
- builds layout incrementally from real rendered output
- adapts when item size changes at runtime

This makes it more suitable for cases where:

- item height is not known in advance
- height can change after mount (expansion, async content, dynamic UI)

### 🔄 3. Designed for mutable layouts

This implementation assumes that:

item height is not a stable property

Many virtualization systems treat height as either:

static (fixed-size mode), or
externally provided (estimated mode)

Here, height is treated as:

a runtime-evolving property of the DOM itself

The layout model continuously self-corrects as measurements arrive.

### ⚙️ 4. Reduced configuration surface

Existing solutions are highly configurable, which is powerful but increases complexity:

- measurement strategies
- cache strategies
- scroll container handling
- item key management

This library intentionally reduces configuration to:

“wrap your list and render it”

At the cost of flexibility, but with significantly lower setup overhead.

### ⚠️ When NOT to use this library

This approach is not optimal if you need:

- highly customized rendering pipelines (render-props / data-driven virtualization)
- complex grid layouts or multi-axis virtualization
- strict deterministic layout behavior across environments
- fine-grained control over measurement lifecycle
- integration with existing virtualization infrastructure

In those cases, React Window or TanStack Virtual are better choices.

### 💬 Closing note

This library is not trying to reinvent virtualization theory — it’s an attempt to make dynamic-height virtualization feel unforced in React, without requiring the developer to design a rendering pipeline around it.

## 📄 License

MIT

## 👤 Author

Andrew Bubnov

