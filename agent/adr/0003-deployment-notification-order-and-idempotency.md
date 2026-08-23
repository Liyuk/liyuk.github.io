# ADR 0003: Send subscriber notifications only after a successful deploy

- Status: Accepted
- Date: 2026-08-19

## Decision

GitHub Actions runs `verify → deploy → notify` as dependent jobs: pull requests run `verify` only; a `master` push deploys GitHub Pages after `verify` succeeds, and only a successful deploy triggers the Buttondown notification.

A failed `notify` job never rolls back a completed deployment, but the failure must stay visible and retryable in Actions. The script identifies candidate posts from the pushed diff and de-duplicates by `subject + canonical_url` (older records without a URL are still matched for backward compatibility). Actually sending mail still requires `BUTTONDOWN_API_KEY`.

## Rationale

Notifying before deploy risks sending readers a link that isn't live yet. Notification is an operational side effect and must not block an already-successful static deploy, but it still needs an unambiguous failure signal instead of silently disappearing.

## Constraints

Never write the API key into the repository or build logs. A new notification channel must define its dry-run, retry, and duplicate-send behavior up front and ship with pure-function tests.
