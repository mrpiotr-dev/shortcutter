# Security Policy

This document explains how to report security vulnerabilities in Shortcutter, what to expect after you report one, and how to check that a release is genuine.

## Supported versions

Security fixes go into the **latest minor release** of each package below. Shortcutter is pre-1.0, so upgrading within the latest minor line is the supported path; older lines get no backports.

| Package               | Supported            |
| --------------------- | -------------------- |
| `shortcutter`         | latest minor release |
| `@shortcutter/react`  | latest minor release |
| `@shortcutter/vue`    | latest minor release |
| `@shortcutter/svelte` | latest minor release |
| `@shortcutter/solid`  | latest minor release |

All five packages are released together with the same version number. If you use an older version, please check that the issue also happens on the latest release before reporting it.

## Reporting a vulnerability

Please **do not** report security vulnerabilities in public GitHub issues, discussions or pull requests.

- **Preferred:** [GitHub private vulnerability reporting](https://github.com/mrpiotr-dev/shortcutter/security/advisories/new) for this repository.
- **Alternative:** email [contact@mrpiotr.dev](mailto:contact@mrpiotr.dev) with "Security" in the subject.

Include as much detail as you can:

- a description of the issue and its impact
- affected packages and versions, browser and environment
- steps to reproduce or a proof of concept
- any known mitigations or suggested fixes

You may report anonymously, but a contact method helps coordinate the fix.

## What happens next

The maintainer aims to:

- acknowledge your report within 72 hours
- give an initial assessment within 7 days
- send progress updates at least every 14 days until it is resolved
- release a fix and publish a GitHub security advisory as soon as practical, depending on severity and complexity

Disclosure is coordinated: please allow time for a fix to ship before sharing details publicly.

## Severity and fixes

Severity is assessed with CVSS-style criteria (confidentiality, integrity, availability, exploitability).

- **Critical and high:** fixed and released as soon as possible
- **Medium:** fixed in the next patch release
- **Low:** fixed when practical, or documented as an accepted risk

## Scope

In scope:

- source code of the published packages under `packages/*`
- the files published to npm (`dist/`) and the browser builds served from unpkg and jsDelivr
- the build and release pipeline (`.github/workflows/`), where an issue could affect package integrity

Out of scope:

- the documentation site (www.shortcutter.dev), unless the issue affects package users
- theoretical issues without a practical exploit path
- issues that only affect unsupported versions
- social engineering, phishing or physical attacks
- denial of service that needs unrealistic resources

## Verifying releases

Since 0.4.0, every package is published from GitHub Actions through npm Trusted Publishing, without a stored npm token, and carries a signed [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) that links it to the exact commit and workflow run that built it. Releases are first staged on npm and only made public after the maintainer approves them with two-factor authentication.

To check the packages installed in an npm project:

```sh
npm audit signatures
```

The npm page of each version also shows its provenance under "Provenance".

## Supply chain

Shortcutter has **no runtime dependencies**. Development dependencies are kept up to date and may receive security updates independently of feature releases.

## Recommendations for users

- stay on the latest release
- pin versions with a lockfile and verify them with `npm audit signatures`
- use dependency and security scanning in your own CI

## Recognition

Responsible disclosure is appreciated. Reporters are credited in the advisory unless they prefer to stay anonymous.
