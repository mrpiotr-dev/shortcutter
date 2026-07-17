# Security Policy

This document explains how to report security vulnerabilities for Shortcutter and what to expect during triage and remediation.

## Supported Versions

Security updates are provided for the latest release line.

| Version | Supported |
| --- | --- |
| 0.2.x (latest) | Yes |
| < 0.2.0 | No |

If you are running an unsupported version, please upgrade before reporting unless the issue also reproduces on the latest version.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues.

Report vulnerabilities through GitHub private vulnerability reporting for this repository.

Include as much detail as possible:

- A clear description of the issue and potential impact
- Affected versions and environment details
- Reproduction steps or proof of concept
- Any known mitigations or suggested fixes

You may report anonymously if needed, but including a contact method helps coordinate fixes.

## Disclosure Process

After receiving a report, the maintainer aims to:

- Acknowledge receipt within 72 hours
- Provide an initial triage decision within 7 days
- Share progress updates at least every 14 days until resolution
- Release a fix and publish an advisory as soon as practical, based on severity and complexity

For valid reports, disclosure is coordinated. Please allow time for users to patch before public disclosure.

## Severity and Remediation

Severity is assessed using CVSS-style impact considerations (confidentiality, integrity, availability, and exploitability).

Remediation priority:

- Critical and High: expedited fix and release
- Medium: fix in the next planned patch release
- Low: fix when practical or document as accepted risk

## Scope

In scope:

- Vulnerabilities in source code under src/ and distributed artifacts under bundle/
- Build and release pipeline issues that could affect package integrity

Out of scope:

- Theoretical issues without a practical exploit path
- Vulnerabilities only present in unsupported versions
- Social engineering, phishing, or physical attacks
- Denial-of-service requiring unrealistic resources for this project scale

## Dependency and Supply Chain Notes

Shortcutter has no runtime dependencies by design. Development dependencies are periodically updated and may receive security patches independent of feature releases.

## Security Best Practices for Users

- Keep Shortcutter on the latest supported version
- Pin and verify package versions in your lockfile
- Run dependency and CI security scanning in your own project

## Recognition

Responsible disclosure is appreciated. Reporters may be credited in advisories unless they prefer to remain anonymous.
