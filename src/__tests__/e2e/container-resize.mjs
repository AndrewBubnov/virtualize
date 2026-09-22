import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	await page.waitForSelector('#table-scroll', { timeout: 15000 });
	await page.waitForTimeout(1500);

	const state = () =>
		page.evaluate(() => {
			const scroller = document.getElementById('table-scroll');
			if (!(scroller instanceof HTMLElement)) return { ok: false };
			const srect = scroller.getBoundingClientRect();
			const kids = [...(scroller.firstElementChild?.children ?? [])].filter(
				el => el.tagName !== 'DIV' || !/sticky/.test(el.getAttribute('style') ?? '')
			);
			const first = kids[0]?.getBoundingClientRect();
			const last = kids[kids.length - 1]?.getBoundingClientRect();
			return {
				ok: true,
				scrollTop: Math.round(scroller.scrollTop),
				clientHeight: scroller.clientHeight,
				n: kids.length,
				firstTop: first ? Math.round(first.top - srect.top) : null,
				lastBottom: last ? Math.round(last.bottom - srect.top) : null,
			};
		});

	// Scroll to the middle, then grow the container WITHOUT scrolling.
	await page.evaluate(() => {
		const scroller = document.getElementById('table-scroll');
		if (scroller instanceof HTMLElement) scroller.scrollTop = scroller.scrollHeight / 2;
	});
	await page.waitForTimeout(800);
	const before = await state();
	await page.evaluate(() => {
		const scroller = document.getElementById('table-scroll');
		if (scroller instanceof HTMLElement) scroller.style.height = '2000px';
	});
	await page.waitForTimeout(800);
	const after = await state();

	const covered =
		after.ok &&
		after.firstTop !== null &&
		after.lastBottom !== null &&
		after.firstTop <= 1 &&
		after.lastBottom >= after.clientHeight - 1;
	console.log(JSON.stringify({ before, after, covered }));
	console.log(covered ? 'E2E PASS' : 'E2E FAIL');
	process.exitCode = covered ? 0 : 1;
} finally {
	await browser.close();
}
