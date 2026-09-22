import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	await page.getByRole('button', { name: 'To index' }).waitFor({ timeout: 15000 });

	const info = await page.evaluate(() => {
		const btn = document.querySelector('button');
		const scroller = btn?.nextElementSibling;
		if (!(scroller instanceof HTMLElement)) return { ok: false, reason: 'no scroller' };
		return {
			ok: true,
			scrollTop: scroller.scrollTop,
			scrollHeight: scroller.scrollHeight,
			clientHeight: scroller.clientHeight,
			renderedItems: scroller.firstElementChild?.childElementCount ?? -1,
		};
	});
	console.log(JSON.stringify(info));
} finally {
	await browser.close();
}
