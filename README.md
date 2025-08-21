# Zephyr Blueprint Starter

**Principle:** *DOM is the source of truth.* You update **attributes**, listen to **events**, and let elements perform direct, targeted DOM mutations. No reconciliation, no template compiler.

## Why
- **Speed**: O(1) direct updates via precomputed references—no vDOM diff.
- **Clarity**: HTML & CSS remain primary. State lives in the DOM via attributes.
- **Interop**: Works in any app. React/Vue adapters are trivial (just set attributes).
- **A11y & Forms**: Prefer native semantics and Form-Associated Custom Elements.

## Quickstart
```bash
npm i
npm run dev
# open http://localhost:5173/public/