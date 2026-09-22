export declare class FenwickTree {
    private tree;
    private n;
    private logn;
    constructor(sizes: Float64Array);
    update(i: number, delta: number): void;
    prefixSum(i: number): number;
    total(): number;
    findByPrefixSum(target: number): number;
}
