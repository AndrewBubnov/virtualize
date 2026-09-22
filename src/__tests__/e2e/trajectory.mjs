import { chromium } from '@playwright/test';

const TARGET = Number(process.argv[2] ?? 34567);
const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.goto(BASE, { waitUntil: 'load' });
	await page.getByRole('button', { name: 'To index' }).waitFor({ timeout: 15000 });
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
				t: Math.round(performance.now()),
				scrollTop: Math.round(scroller.scrollTop * 100) / 100,
				renderedFirst: rendered[0] ?? -1,
				renderedLast: rendered[rendered.length - 1] ?? -1,
				targetOffset: frect ? Math.round((frect.top - srect.top) * 100) / 100 : null,
			};
		}, TARGET);

	await page.getByRole('button', { name: 'To index' }).click();
	const traj = [];
	for (const wait of [50, 150, 300, 600, 1200, 2500]) {
		await page.waitForTimeout(wait === 50 ? 50 : wait - traj[traj.length - 1].at);
		const m = await measure();
		traj.push({ at: wait, ...m });
	}
	console.log(JSON.stringify({ target: TARGET, traj }, null, 1));
} finally {
	await browser.close();
}
