# Problem 4 — Three Ways to Sum to N

Three TypeScript implementations of `sum_to_n(n)`, which returns the sum of integers from 1 to n inclusive.

## Implementations

| Function | Approach | Time | Space |
|----------|----------|------|-------|
| `sum_to_n_a` | Gauss closed-form formula: `n * (n + 1) / 2` | O(1) | O(1) |
| `sum_to_n_b` | Iterative `for` loop | O(n) | O(1) |
| `sum_to_n_c` | Recursion: `n + sum(n - 1)` | O(n) | O(n) |

## Notes

- **A** is optimal — constant time and space regardless of input size.
- **B** is straightforward and safe for large `n` without stack concerns.
- **C** is the most readable expression of the recursive definition but risks a stack overflow for very large `n` due to O(n) call frames.

## File

- [`solution.ts`](solution.ts)
