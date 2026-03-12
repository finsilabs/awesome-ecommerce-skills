# Admin Panel Access Control for Vantage Store

## Problem/Feature Description

Vantage Store is a growing e-commerce company preparing for their first PCI-DSS assessment. The engineering team has been asked to implement a proper access control system for the admin panel. Currently, all admin users have the same level of access, which is a red flag for the assessor. Different members of the team have different business roles: some only need to view orders, some manage inventory and fulfil orders, some are responsible for payment configuration, and a small group of superusers need unrestricted access for technical maintenance.

The assessor also flagged that the admin panel has no password policy at all — users can set any password and never change it. The assessor provided a specific list of password requirements that Vantage Store must meet. Additionally, given that the admin panel provides access to order information and payment configuration, the assessor noted that login to the admin panel must require more than just a password.

## Output Specification

Produce the following files:

- `rbac.ts` — A TypeScript module implementing role-based access control for the admin panel. It should define the set of admin roles and the permissions each role has. It should also include a middleware function that enforces authentication and authorisation on admin routes, logging both failed authentication and authorisation events via an audit logger instance.

- `password-policy.ts` — A TypeScript module that exports a password policy configuration object and a function that validates a candidate password against that policy. Include a comment on each policy field explaining the compliance rationale.

- `security-notes.md` — A short document listing the MFA requirement for admin access and the periodic access review obligation required by PCI-DSS, with a brief explanation of what is required for each.
