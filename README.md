[![npm version](https://badge.fury.io/js/clear-virtual-list.svg)](https://www.npmjs.com/package/clear-virtual-list)

# React Virtualized Resizable List

A React virtualization utility for rendering large lists with **dynamic, resizable item heights**, built around automatic DOM measurement and an internal layout cache.

Unlike traditional virtualized list libraries that rely on explicit item measurement APIs or fixed-size assumptions, this implementation works directly with ReactNode[] and continuously refines layout based on real DOM feedback.

## ⚙️ API

`<Virtualized />`

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
<Virtualized height={500} width={400}>
  {items.map(item => <div>{item}</div>)}
</Virtualized>
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

