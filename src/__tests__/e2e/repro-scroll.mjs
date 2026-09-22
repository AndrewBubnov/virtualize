import { chromium } from '@playwright/test';

const TARGET = Number(process.argv[2] ?? 1245671); // Must match the App button index.
const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	const btn = page.getByRole('button', { name: 'To index' });
	await btn.waitFor({ timeout: 15000 });
	// let initial RO measurements settle
	await page.waitForTimeout(1500);

	const measure = () =>
		page.evaluate(target => {
			const button = document.querySelector('button');
			const scroller = button?.nextElementSibling;
			if (!(scroller instanceof HTMLElement)) return { ok: false };
			const srect = scroller.getBoundingClientRect();
			const inner = scroller.firstElementChild;
			const kids = inner ? [...inner.children] : [];
			const parseIdx = el => {
				const m = /^\d+/.exec(el.textContent ?? '');
				return m ? Number(m[0]) : -1;
			};
			const rendered = kids.map(parseIdx);
			const found = kids.find(el => parseIdx(el) === target);
			const frect = found?.getBoundingClientRect();
			return {
				ok: true,
				scrollTop: scroller.scrollTop,
				scrollHeight: scroller.scrollHeight,
				clientHeight: scroller.clientHeight,
				maxScroll: scroller.scrollHeight - scroller.clientHeight,
				renderedFirst: rendered[0] ?? -1,
				renderedLast: rendered[rendered.length - 1] ?? -1,
				renderedCount: rendered.length,
				targetRendered: found !== undefined,
				targetOffsetFromViewportTop: frect ? frect.top - srect.top : null,
				targetHeight: frect ? frect.height : null,
			};
		}, TARGET);

	const before = await measure();
	await btn.click();
	await page.waitForTimeout(2500);
	const afterFirst = await measure();
	await btn.click();
	await page.waitForTimeout(2500);
	const afterSecond = await measure();

	const result = { target: TARGET, before, afterFirst, afterSecond };
	console.log(JSON.stringify(result, null, 1));

	// Presence gate: after the first click the target must be rendered and
	// visible inside the viewport (align defaults to 'start').
	const firstOffset = afterFirst.targetOffsetFromViewportTop;
	const pass =
		afterFirst.targetRendered === true &&
		typeof firstOffset === 'number' &&
		typeof afterFirst.targetHeight === 'number' &&
		firstOffset > -afterFirst.targetHeight &&
		firstOffset < afterFirst.clientHeight;
	console.log(pass ? 'E2E PASS' : 'E2E FAIL');
	process.exitCode = pass ? 0 : 1;
} finally {
	await browser.close();
}
