import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	await page.waitForSelector('#table-scroll, button', { timeout: 15000 });
	await page.waitForTimeout(1500);

	const state = () =>
		page.evaluate(() => {
			const scroller =
				document.getElementById('table-scroll') ??
				document.querySelector('button')?.nextElementSibling;
			if (!(scroller instanceof HTMLElement)) return { ok: false };
			const srect = scroller.getBoundingClientRect();
			// Skip the sticky table header, if present.
			const kids = [...(scroller.firstElementChild?.children ?? [])].filter(
				el => el.getAttribute('style')?.includes('sticky') !== true
			);
			const parseIdx = el => {
				const m = /^\d+/.exec(el.textContent ?? '');
				return m ? Number(m[0]) : -1;
			};
			const first = kids[0]?.getBoundingClientRect();
			const last = kids[kids.length - 1]?.getBoundingClientRect();
			return {
				ok: true,
				scrollTop: Math.round(scroller.scrollTop),
				firstIdx: kids.length ? parseIdx(kids[0]) : -1,
				lastIdx: kids.length ? parseIdx(kids[kids.length - 1]) : -1,
				n: kids.length,
				firstTop: first ? Math.round(first.top - srect.top) : null,
				lastBottom: last ? Math.round(last.bottom - srect.top) : null,
				clientHeight: scroller.clientHeight,
			};
		});

	const out = [];
	out.push({ pos: 'initial', ...(await state()) });

	for (const target of [200000, 800000, 3000000, 9000000, 100000]) {
		await page.evaluate(t => {
			const scroller =
				document.getElementById('table-scroll') ??
				document.querySelector('button')?.nextElementSibling;
			if (scroller instanceof HTMLElement) scroller.scrollTop = t;
		}, target);
		await page.waitForTimeout(800);
		const s = await state();
		// coverage: first item at/above viewport top, last item at/below viewport bottom
		const covered = s.firstTop <= 1 && s.lastBottom >= s.clientHeight - 1;
		out.push({ pos: target, ...s, covered });
	}
	console.log(JSON.stringify(out, null, 1));
} finally {
	await browser.close();
}
