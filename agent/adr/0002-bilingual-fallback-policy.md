# ADR 0002: Bilingual fallback and publication policy

- Status: Accepted
- Date: 2026-08-19

## Decision

Chinese is the source locale. Published Chinese content in `writing`, `project`, `consulting`, and `gallery` must have an English sibling. `research` may publish without one yet; its English route falls back to the Chinese variant via `pickLocaleVariant()`.

English files use `locale: en`, the filename `en.md` (`<slug>.en.md` for galleries), a correct `translationKey`, and `translationStatus: draft | reviewed`. Shared metadata between the Chinese and English sibling (dates, `draft`, `tags`, and other fields `audit:content` checks) must agree.

## Rationale

Personal writing, projects, and consulting pieces get a strict bilingual requirement so the site never carries a long-lived half-translated entry. Research content may need to publish Chinese methodology or results before translation is ready; the fallback avoids a hard 404 on the English route while turning the gap into a visible audit warning instead of a silent one.

## Exit condition

If the "research missing English" warning count stays at zero, or the site decides research must also be strictly bilingual, change `TRANSLATION_POLICY.research` in `scripts/audit-content.mjs` to `required` and close the existing gap first.
