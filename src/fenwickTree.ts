export class FenwickTree {
	private tree: Float64Array;
	private n: number;
	private logn: number;

	constructor(sizes: Float64Array) {
		this.n = sizes.length;
		this.tree = new Float64Array(this.n + 1);
		for (let i = 0; i < this.n; i++) this.tree[i + 1] = sizes[i];
		for (let x = 1; x <= this.n; x++) {
			const parent = x + (x & -x);
			if (parent <= this.n) this.tree[parent] += this.tree[x];
		}
		this.logn = this.n > 0 ? Math.floor(Math.log2(this.n)) : 0;
	}

	update(i: number, delta: number) {
		for (let x = i + 1; x <= this.n; x += x & -x) this.tree[x] += delta;
	}

	prefixSum(i: number): number {
		let sum = 0;
		for (let x = i; x > 0; x -= x & -x) sum += this.tree[x];
		return sum;
	}

	total(): number {
		return this.prefixSum(this.n);
	}

	findByPrefixSum(target: number): number {
		let pos = 0;
		let remaining = target;
		const EPS = 1e-6;
		for (let pw = 1 << this.logn; pw > 0; pw >>= 1) {
			const next = pos + pw;
			if (next <= this.n && this.tree[next] <= remaining + EPS) {
				pos = next;
				remaining -= this.tree[next];
			}
		}
		return pos;
	}
}
