# METADATA
# title: Harbourview Critical Vulnerability Policy
# description: Fail builds on critical/high CVSS vulnerabilities that have fixes available
# custom:
#   id: HV-VULN-001
#   severity: CRITICAL
package harbourview.trivy

import rego.v1

# Maximum allowed CVSS v3 score
max_cvss := 7.0

# Deny if any critical or high severity vulnerability with a fixed version exists
deny[msg] if {
	result := input.Results[_]
	vuln := result.Vulnerabilities[_]
	vuln.Severity in {"CRITICAL", "HIGH"}
	vuln.FixedVersion != ""
	some _, cvss in vuln.CVSS
	cvss.V3Score > max_cvss
	msg := sprintf("Blocked vulnerability %s (%s) in %s@%s — CVSS %.1f (fixed in %s)", [
		vuln.VulnerabilityID,
		vuln.Severity,
		vuln.PkgName,
		vuln.InstalledVersion,
		cvss.V3Score,
		vuln.FixedVersion,
	])
}

# Deny secrets findings
deny[msg] if {
	result := input.Results[_]
	secret := result.Secrets[_]
	msg := sprintf("Secret detected: %s in %s", [secret.RuleID, secret.Target])
}
