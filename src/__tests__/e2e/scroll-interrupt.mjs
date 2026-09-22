import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	await page.getByRole('button', { name: 'To index' }).waitFor({ timeout: 15000 });
	await page.waitForTimeout(1500);

	const state = label =>
		page.evaluate(async lbl => {
			const button = document.querySelector('button');
			const scroller = button?.nextElementSibling;
			if (!(scroller instanceof HTMLElement)) return { label: lbl, ok: false };
			const srect = scroller.getBoundingClientRect();
			const kids = [...(scroller.firstElementChild?.children ?? [])];
			const parseIdx = el => {
				const m = /^\d+/.exec(el.textContent ?? '');
				return m ? Number(m[0]) : -1;
			};
			const first = kids[0]?.getBoundingClientRect();
			const last = kids[kids.length - 1]?.getBoundingClientRect();
			const dbg = window.__virtDebug?.() ?? null;
			return {
				label: lbl,
				ok: true,
				scrollTop: Math.round(scroller.scrollTop),
				firstIdx: kids.length ? parseIdx(kids[0]) : -1,
				lastIdx: kids.length ? parseIdx(kids[kids.length - 1]) : -1,
				n: kids.length,
				firstTop: first ? Math.round(first.top - srect.top) : null,
				lastBottom: last ? Math.round(last.bottom - srect.top) : null,
				dbg,
			};
		}, label);

	const out = [];
	// click, then immediately scroll manually mid-settle
	await page.getByRole('button', { name: 'To index' }).click();
	await page.waitForTimeout(60);
	await page.evaluate(() => {
		const scroller = document.querySelector('button')?.nextElementSibling;
		if (scroller instanceof HTMLElement) scroller.scrollTop = 100000;
	});
	await page.waitForTimeout(1200);
	out.push(await state('click-then-manual'));

	// rapid wheel scrolling
	const scroller = page.locator('button + div');
	await scroller.hover();
	for (let i = 0; i < 12; i++) {
		await page.mouse.wheel(0, 600);
		await page.waitForTimeout(60);
	}
	await page.waitForTimeout(1000);
	out.push(await state('after-wheel'));

	console.log(JSON.stringify(out, null, 1));
} finally {
	await browser.close();
}
