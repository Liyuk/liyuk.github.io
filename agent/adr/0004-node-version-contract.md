# ADR 0004: Node 24 as the engineering runtime contract

- Status: Accepted
- Date: 2026-08-19

## Decision

`.node-version` pins Node `24.18.0`; `package.json` declares `engines.node: ">=24.18.0 <25"`; local development and CI both use `npm ci` against the same version contract.

## Rationale

The build, `node --test`, and several scripts depend on this Node line's ESM and built-in type-stripping behavior. Declaring the version only inside a workflow file lets local, git-hook, and CI environments drift apart, so the version is a repository-level contract instead.

## Migration

When upgrading Node, update `.node-version`, `engines`, and CI together, then run the full publish gate and browser checks before merging. Append the migration outcome to this ADR.
