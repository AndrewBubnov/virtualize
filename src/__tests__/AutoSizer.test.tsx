import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoSizer } from '../components/AutoSizer';

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeEach(() => {
	(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;
});

describe('AutoSizer', () => {
	it('renders children', () => {
		render(
			<AutoSizer offset={0} onMount={vi.fn()} onResize={vi.fn()}>
				<div>Test content</div>
			</AutoSizer>
		);
		expect(screen.getByText('Test content')).toBeInTheDocument();
	});

	it('applies translate3d transform with offset', () => {
		render(
			<AutoSizer offset={120} onMount={vi.fn()} onResize={vi.fn()}>
				<div data-testid="child">Content</div>
			</AutoSizer>
		);
		const wrapper = screen.getByTestId('child').parentElement;
		expect(wrapper).toHaveStyle({ position: 'absolute' });
		expect(wrapper?.getAttribute('style')).toContain('translate3d(0, 120px, 0)');
	});

	it('renders with offset 0', () => {
		render(
			<AutoSizer offset={0} onMount={vi.fn()} onResize={vi.fn()}>
				<div data-testid="child">Content</div>
			</AutoSizer>
		);
		const wrapper = screen.getByTestId('child').parentElement;
		expect(wrapper?.getAttribute('style')).toContain('translate3d(0, 0px, 0)');
	});
});
