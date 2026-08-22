# METADATA
# title: Harbourview Misconfiguration Policy
# description: Custom checks for Dockerfile and config security
# schemas:
#   - input: schema["dockerfile"]
# custom:
#   id: HV-MISCONF-001
#   severity: HIGH
#   input:
#     selector:
#       - type: dockerfile
package harbourview.misconfig

import rego.v1

# Deny running as root in final stage
deny[res] if {
	input.Stages[stage_idx].Commands[cmd_idx].Cmd == "user"
	user := input.Stages[stage_idx].Commands[cmd_idx].Value[0]
	user == "root" or user == "0"
	msg := "Final stage must not run as root/0"
	res := {"msg": msg, "severity": "HIGH"}
}

# Require HEALTHCHECK
deny[res] if {
	not has_healthcheck
	msg := "Dockerfile must include a HEALTHCHECK instruction"
	res := {"msg": msg, "severity": "MEDIUM"}
}

has_healthcheck if {
	some stage in input.Stages
	some cmd in stage.Commands
	cmd.Cmd == "healthcheck"
}
