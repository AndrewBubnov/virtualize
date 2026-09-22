import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	await page.getByRole('button', { name: 'To index' }).waitFor({ timeout: 15000 });
	await page.waitForTimeout(1500);

	const info = await page.evaluate(() => {
		const button = document.querySelector('button');
		const scroller = button?.nextElementSibling;
		if (!(scroller instanceof HTMLElement)) return { ok: false };
		scroller.scrollTop = scroller.scrollHeight;
		return { ok: true, maxScroll: scroller.scrollHeight - scroller.clientHeight };
	});
	await page.waitForTimeout(1000);
	const bottom = await page.evaluate(() => {
		const scroller = document.querySelector('button')?.nextElementSibling;
		if (!(scroller instanceof HTMLElement)) return { ok: false };
		const kids = [...(scroller.firstElementChild?.children ?? [])];
		const parseIdx = el => {
			const m = /^\d+/.exec(el.textContent ?? '');
			return m ? Number(m[0]) : -1;
		};
		return {
			ok: true,
			scrollTop: Math.round(scroller.scrollTop),
			lastIdx: kids.length ? parseIdx(kids[kids.length - 1]) : -1,
			n: kids.length,
		};
	});
	console.log(JSON.stringify({ ...info, ...bottom }));
} finally {
	await browser.close();
}
