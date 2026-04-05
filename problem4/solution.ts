/**
 * Implementation A — Gauss formula
 *
 * Uses the closed-form arithmetic series formula: n * (n + 1) / 2
 *
 * Time complexity:  O(1) — constant time regardless of n
 * Space complexity: O(1) — no additional memory used
 */
function sum_to_n_a(n: number): number {
  return (n * (n + 1)) / 2;
}

/**
 * Implementation B — Iterative loop
 *
 * Accumulates the sum by iterating from 1 to n.
 *
 * Time complexity:  O(n) — one pass through n iterations
 * Space complexity: O(1) — only a single accumulator variable
 */
function sum_to_n_b(n: number): number {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
}

/**
 * Implementation C — Recursion
 *
 * Reduces the problem by 1 each call: sum(n) = n + sum(n - 1), base case n <= 0.
 *
 * Time complexity:  O(n) — n recursive calls
 * Space complexity: O(n) — n stack frames held simultaneously
 */
function sum_to_n_c(n: number): number {
  if (n <= 0) return 0;
  return n + sum_to_n_c(n - 1);
}
