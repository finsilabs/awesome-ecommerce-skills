---
name: pci-dss-compliance
description: "PCI-DSS requirements mapping, SAQ selection, and implementation checklist"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [pci-dss, security, compliance, payments, encryption, tokenization, saq]
triggers: ["implement PCI compliance", "PCI-DSS requirements", "secure payment data", "PCI SAQ selection"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# PCI-DSS Compliance

## Overview

Implement PCI-DSS (Payment Card Industry Data Security Standard) requirements for e-commerce applications including scope reduction through tokenization, SAQ (Self-Assessment Questionnaire) selection, network segmentation, encryption at rest and in transit, access control, logging and monitoring, and vulnerability management. This skill covers the 12 PCI-DSS requirements as they apply to web-based commerce, the practical engineering tasks to achieve compliance, and strategies to minimize your cardholder data environment (CDE).

## When to Use This Skill

- When accepting credit card payments and need to determine your PCI compliance scope
- When selecting between SAQ A, SAQ A-EP, SAQ D, or other questionnaire types
- When implementing tokenization to reduce PCI scope (Stripe Elements, Braintree, Adyen)
- When setting up logging, monitoring, and alerting infrastructure for PCI audit readiness
- When preparing for a QSA (Qualified Security Assessor) audit or completing an SAQ

## Core Instructions

1. **Determine your SAQ type based on payment integration**

   The SAQ type depends on how cardholder data flows through your systems:

   ```
   Decision tree for SAQ selection:

   Does cardholder data ever touch your server?
   ├── YES → SAQ D (most requirements apply, ~330 controls)
   └── NO
       ├── Is the payment form an iframe from the processor?
       │   ├── YES (Stripe Checkout, PayPal hosted) → SAQ A (~22 controls)
       │   └── NO
       │       └── JS from processor collects card data on your page?
       │           ├── YES (Stripe Elements, Braintree Drop-in) → SAQ A-EP (~191 controls)
       │           └── NO → Consult your QSA
   ```

   Scope reduction strategy -- always prefer SAQ A when possible:

   ```typescript
   // SAQ A: Use Stripe Checkout (hosted payment page) — card data never touches your server
   // This is the gold standard for scope reduction
   const session = await stripe.checkout.sessions.create({
     line_items: [{ price: priceId, quantity: 1 }],
     mode: 'payment',
     success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${YOUR_DOMAIN}/cancel`,
   });
   // Redirect customer to session.url — Stripe hosts the entire payment form

   // SAQ A-EP: Stripe Elements (JS tokenization on your page)
   // Card data is collected in an iframe but your page JS controls the flow
   const elements = stripe.elements({ clientSecret });
   const paymentElement = elements.create('payment');
   paymentElement.mount('#payment-element');
   ```

2. **Implement encryption in transit (Requirement 4)**

   ```nginx
   # nginx.conf — TLS 1.2+ only, strong cipher suites
   server {
       listen 443 ssl http2;
       server_name store.example.com;

       ssl_certificate     /etc/ssl/certs/store.example.com.pem;
       ssl_certificate_key /etc/ssl/private/store.example.com.key;

       # PCI-DSS requires TLS 1.2 or higher
       ssl_protocols TLSv1.2 TLSv1.3;

       # Strong cipher suites only
       ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
       ssl_prefer_server_ciphers on;

       # HSTS (Requirement 4.1)
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

       # Redirect HTTP to HTTPS
       if ($scheme != "https") {
           return 301 https://$host$request_uri;
       }

       # Security headers
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;" always;
   }
   ```

3. **Set up logging and monitoring (Requirements 10 & 11)**

   ```typescript
   // Centralized audit logging for PCI-DSS Requirement 10
   interface AuditLogEntry {
     timestamp: string;        // ISO 8601 with timezone
     userId: string;           // Who performed the action
     userIp: string;           // Source IP
     action: string;           // What was done
     resource: string;         // What was affected
     resourceId?: string;
     outcome: 'success' | 'failure';
     details?: Record<string, unknown>;
   }

   class AuditLogger {
     constructor(private readonly transport: LogTransport) {}

     async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
       const fullEntry: AuditLogEntry = {
         ...entry,
         timestamp: new Date().toISOString(),
       };

       // Write to immutable log store (Requirement 10.5 — logs must be tamper-proof)
       await this.transport.write(fullEntry);
     }

     // Requirement 10.2 — specific events that MUST be logged
     async logAuthentication(userId: string, ip: string, success: boolean): Promise<void> {
       await this.log({
         userId,
         userIp: ip,
         action: 'authentication',
         resource: 'session',
         outcome: success ? 'success' : 'failure',
       });
     }

     async logAccessToCardholder(userId: string, ip: string, resource: string): Promise<void> {
       await this.log({
         userId,
         userIp: ip,
         action: 'access_cardholder_data',
         resource,
         outcome: 'success',
       });
     }

     async logAdminAction(userId: string, ip: string, action: string, details: Record<string, unknown>): Promise<void> {
       await this.log({
         userId,
         userIp: ip,
         action: `admin:${action}`,
         resource: 'system',
         outcome: 'success',
         details,
       });
     }

     async logPrivilegeEscalation(userId: string, ip: string, newRole: string): Promise<void> {
       await this.log({
         userId,
         userIp: ip,
         action: 'privilege_change',
         resource: 'user_role',
         outcome: 'success',
         details: { newRole },
       });
     }
   }
   ```

4. **Implement access control (Requirements 7 & 8)**

   ```typescript
   // Role-based access control for admin panel
   // Requirement 7: Restrict access to cardholder data by business need-to-know
   // Requirement 8: Assign unique IDs, enforce MFA, strong passwords

   enum AdminRole {
     VIEWER = 'viewer',           // Read-only access to orders (no card data)
     OPERATOR = 'operator',       // Process orders, manage inventory
     ADMIN = 'admin',             // Full access, user management
     PAYMENT_ADMIN = 'payment_admin',  // Access to payment configuration
   }

   const rolePermissions: Record<AdminRole, string[]> = {
     [AdminRole.VIEWER]: ['orders:read', 'products:read', 'customers:read'],
     [AdminRole.OPERATOR]: ['orders:read', 'orders:update', 'products:*', 'inventory:*'],
     [AdminRole.ADMIN]: ['*'],
     [AdminRole.PAYMENT_ADMIN]: ['orders:read', 'payments:*', 'refunds:*'],
   };

   function checkPermission(userRole: AdminRole, requiredPermission: string): boolean {
     const permissions = rolePermissions[userRole] || [];
     return permissions.some(p =>
       p === '*' || p === requiredPermission ||
       (p.endsWith(':*') && requiredPermission.startsWith(p.replace(':*', ':')))
     );
   }

   // Middleware: enforce authentication + authorization
   function requirePermission(permission: string) {
     return async (req: Request, res: Response, next: NextFunction) => {
       const user = req.adminUser;
       if (!user) {
         await auditLogger.logAuthentication('unknown', req.ip, false);
         return res.status(401).json({ error: 'Authentication required' });
       }

       if (!checkPermission(user.role, permission)) {
         await auditLogger.log({
           userId: user.id,
           userIp: req.ip,
           action: 'access_denied',
           resource: permission,
           outcome: 'failure',
         });
         return res.status(403).json({ error: 'Insufficient permissions' });
       }

       next();
     };
   }

   // Requirement 8.3.6: Password complexity requirements
   const PASSWORD_POLICY = {
     minLength: 12,
     requireUppercase: true,
     requireLowercase: true,
     requireNumbers: true,
     requireSpecialChars: true,
     maxAge: 90,             // Days before forced rotation
     historyCount: 4,        // Cannot reuse last N passwords
     lockoutAttempts: 6,     // Lock after N failed attempts
     lockoutDuration: 30,    // Minutes
   };
   ```

5. **Configure Content Security Policy for payment pages (Requirement 6)**

   ```typescript
   // CSP middleware — Requirement 6.4.3 (PCI-DSS v4.0)
   // All payment page scripts must be inventoried and authorized
   function paymentPageCSP(req: Request, res: Response, next: NextFunction) {
     const nonce = crypto.randomBytes(16).toString('base64');
     res.locals.cspNonce = nonce;

     const csp = [
       `default-src 'self'`,
       `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
       `frame-src https://js.stripe.com https://hooks.stripe.com`,
       `connect-src 'self' https://api.stripe.com`,
       `style-src 'self' 'nonce-${nonce}'`,
       `img-src 'self' data: https://*.stripe.com`,
       `font-src 'self'`,
       `object-src 'none'`,
       `base-uri 'self'`,
       `form-action 'self'`,
     ].join('; ');

     res.setHeader('Content-Security-Policy', csp);
     next();
   }

   // Requirement 6.4.3 also requires a script inventory
   // Maintain a documented list of all scripts on payment pages:
   const AUTHORIZED_PAYMENT_PAGE_SCRIPTS = [
     { src: 'https://js.stripe.com/v3/', justification: 'Stripe payment tokenization', owner: 'Stripe Inc.' },
     { src: '/js/checkout.js', justification: 'Checkout form logic', owner: 'Internal' },
   ];
   ```

6. **Set up vulnerability scanning and patch management (Requirements 5, 6, 11)**

   ```yaml
   # .github/workflows/pci-security-scan.yml
   name: PCI Security Scanning
   on:
     push:
       branches: [main]
     schedule:
       - cron: '0 6 * * 1'  # Weekly Monday 6 AM — Requirement 11.3

   jobs:
     dependency-scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         # Requirement 6.3.2: Inventory third-party software components
         - name: Dependency audit
           run: npm audit --audit-level=high

         # Requirement 6.2.4: Software composition analysis
         - name: Snyk vulnerability scan
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             args: --severity-threshold=high

     container-scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Build container
           run: docker build -t store:latest .

         # Requirement 11.3.1: Internal vulnerability scan
         - name: Trivy container scan
           uses: aquasecurity/trivy-action@master
           with:
             image-ref: 'store:latest'
             severity: 'HIGH,CRITICAL'
             exit-code: '1'

     sast:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         # Requirement 6.3.1: Static application security testing
         - name: CodeQL analysis
           uses: github/codeql-action/analyze@v3
           with:
             languages: javascript
   ```

## Examples

### PCI-DSS requirements checklist for e-commerce

```markdown
## PCI-DSS v4.0 Requirements Mapped to E-commerce Engineering Tasks

### 1. Network Security
- [ ] Firewall/WAF configured to restrict inbound traffic to ports 443 only
- [ ] Network segmentation isolates payment-processing systems from general servers
- [ ] Database servers not directly accessible from the internet

### 2. Secure Configuration
- [ ] Default passwords changed on all systems, databases, and admin panels
- [ ] Unnecessary services and ports disabled
- [ ] System hardening applied (CIS benchmarks or vendor guidelines)

### 3. Protect Stored Data
- [ ] No raw PAN (card numbers) stored anywhere in your systems
- [ ] Tokenization via Stripe/Braintree replaces card data with tokens
- [ ] Database encryption at rest enabled (AES-256)

### 4. Encrypt Transmissions
- [ ] TLS 1.2+ enforced on all external connections
- [ ] HSTS headers configured with min 1-year max-age
- [ ] Internal service-to-service communication encrypted

### 5. Anti-Malware
- [ ] Container images scanned for vulnerabilities before deployment
- [ ] Runtime protection (Falco, Sysdig) on production servers

### 6. Secure Development
- [ ] SAST (static analysis) runs in CI/CD pipeline
- [ ] Dependency scanning (npm audit, Snyk) with auto-PR for critical CVEs
- [ ] Code review required before merge to main branch
- [ ] Payment page script inventory documented (Req 6.4.3)

### 7-8. Access Control
- [ ] Role-based access control with least privilege
- [ ] Unique user IDs for all admin and system accounts
- [ ] MFA enabled for all admin access
- [ ] Password policy enforces 12+ characters, complexity, 90-day rotation

### 9. Physical Security
- [ ] Cloud provider SOC 2 / PCI-DSS attestation on file
- [ ] No local storage of cardholder data on workstations

### 10. Logging & Monitoring
- [ ] All authentication events logged (success and failure)
- [ ] All admin actions logged with user ID, timestamp, IP
- [ ] Logs shipped to immutable storage (CloudWatch, Datadog, Splunk)
- [ ] Log retention: 12 months minimum, 3 months immediately available

### 11. Vulnerability Management
- [ ] Quarterly external vulnerability scans by ASV (Approved Scanning Vendor)
- [ ] Annual penetration test
- [ ] Weekly internal vulnerability scans

### 12. Policy & Procedures
- [ ] Information security policy documented and reviewed annually
- [ ] Incident response plan documented and tested
- [ ] Employee security awareness training completed annually
```

### Terraform infrastructure for PCI-compliant AWS setup

```hcl
# VPC with network segmentation (Requirement 1)
resource "aws_vpc" "pci_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "pci-compliant-vpc" }
}

# Public subnet (web tier only)
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.pci_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "pci-public-web" }
}

# Private subnet (application tier — no direct internet access)
resource "aws_subnet" "private_app" {
  vpc_id            = aws_vpc.pci_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "pci-private-app" }
}

# Isolated subnet (database — no internet, no web access)
resource "aws_subnet" "private_db" {
  vpc_id            = aws_vpc.pci_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "pci-private-db" }
}

# Security group for web tier — HTTPS only
resource "aws_security_group" "web" {
  vpc_id = aws_vpc.pci_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group for database — only from app tier
resource "aws_security_group" "database" {
  vpc_id = aws_vpc.pci_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

# RDS with encryption at rest (Requirement 3)
resource "aws_db_instance" "pci_db" {
  engine                 = "postgres"
  instance_class         = "db.r6g.large"
  allocated_storage      = 100
  storage_encrypted      = true           # Requirement 3.4
  kms_key_id             = aws_kms_key.pci_key.arn
  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.database.id]
  multi_az               = true
  backup_retention_period = 30
  deletion_protection     = true

  # Requirement 10: Enable audit logging
  enabled_cloudwatch_logs_exports = ["postgresql"]
}

# CloudTrail for API audit logging (Requirement 10)
resource "aws_cloudtrail" "pci_trail" {
  name                       = "pci-audit-trail"
  s3_bucket_name             = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail      = true
  enable_log_file_validation = true  # Tamper detection (Requirement 10.5)
}
```

## Best Practices

- **Minimize your CDE (Cardholder Data Environment)** -- use hosted payment forms (Stripe Checkout, Adyen Drop-in) to qualify for SAQ A and reduce from ~330 controls to ~22
- **Never store, process, or transmit raw card numbers** -- always use tokenization; if you never see card data, most PCI requirements don't apply to your servers
- **Ship logs to immutable storage** -- use append-only log destinations (S3 with Object Lock, CloudWatch Logs) so attackers cannot tamper with audit trails
- **Enforce MFA for all admin access** -- Requirement 8.4.2 mandates MFA for all access to the CDE; implement it for all admin panels, SSH, and cloud console access
- **Automate vulnerability scanning** -- run dependency audits (npm audit, Snyk) in CI/CD and schedule quarterly ASV scans; don't rely on manual processes
- **Document everything** -- PCI auditors want evidence of policies, procedures, and controls; maintain runbooks for incident response, access reviews, and change management
- **Segment your network** -- isolate payment-processing systems on their own subnet/VPC; database servers should never be reachable from the internet
- **Review access quarterly** -- Requirement 7.2.5 requires regular review of user access; automate access review reports and revoke unused accounts

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| SAQ type is wrong — selected SAQ A but payment form is on your page | If you use Stripe Elements (JS tokenization on your page), you need SAQ A-EP, not SAQ A; only fully hosted redirects (Stripe Checkout) qualify for SAQ A |
| Logs don't include all required fields | PCI-DSS 10.2 requires: user ID, event type, date/time, success/failure, origination (IP), and affected resource; audit your log format against this list |
| TLS 1.0/1.1 still enabled on load balancer | Run `nmap --script ssl-enum-ciphers -p 443 store.example.com` to verify; disable TLS 1.0/1.1 in your load balancer and CDN settings |
| Default admin credentials in staging | PCI scope includes all environments connected to production; apply the same hardening to staging if it shares infrastructure |
| No incident response plan | Requirement 12.10.1 requires a documented incident response plan that is tested annually; create one even if you've never had an incident |
| Third-party scripts on payment page not inventoried | PCI-DSS v4.0 Requirement 6.4.3 requires a documented inventory of all scripts on payment pages with business justification; audit with browser dev tools |

## Related Skills

- @stripe-integration
- @customer-accounts
- @ecommerce-caching
- @erp-integration
- @ecommerce-data-warehouse
