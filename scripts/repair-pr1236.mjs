import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const componentPath = 'components/dashboard/MobileCommandCentre.tsx'
const packagePath = 'package.json'
const branchWorkflowPath = '.github/workflows/temporary-key-regulators-repair.yml'
const scriptPath = 'scripts/repair-pr1236.mjs'

const oldBlock = `      {jurisdictionPlaybook?.key_regulators && jurisdictionPlaybook.key_regulators.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">KEY REGULATORS</div>
          {jurisdictionPlaybook.key_regulators.map((r, i) => (
            <div key={r.name} style={{ marginTop: i === 0 ? 4 : 8, paddingTop: i === 0 ? 0 : 8, borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.5)', marginTop: 2 }}>{r.role}</div>
            </div>
          ))}
        </div>
      )}`

const newBlock = `      {jurisdictionPlaybook?.key_regulators && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">KEY REGULATORS</div>
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{jurisdictionPlaybook.key_regulators.primary}</div>
          </div>
          {jurisdictionPlaybook.key_regulators.secondary.map((regulator, index) => (
            <div key={index + '-' + regulator} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.6)', lineHeight: 1.5 }}>{regulator}</div>
            </div>
          ))}
        </div>
      )}`

const source = fs.readFileSync(componentPath, 'utf8')
const matches = source.split(oldBlock).length - 1
if (matches !== 1) throw new Error(`Expected one stale key-regulators block, found ${matches}`)
fs.writeFileSync(componentPath, source.replace(oldBlock, newBlock))

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
delete pkg.scripts.pretypecheck
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)

if (fs.existsSync(branchWorkflowPath)) fs.unlinkSync(branchWorkflowPath)
fs.unlinkSync(scriptPath)

execFileSync('git', ['config', 'user.name', 'github-actions[bot]'])
execFileSync('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
execFileSync('git', ['add', componentPath, packagePath, '-u', branchWorkflowPath, scriptPath])
execFileSync('git', ['commit', '-m', 'fix: align mobile key regulators with canonical shape'])
execFileSync('git', ['push', 'origin', 'repair/mobile-playbook-steps-production'], { stdio: 'inherit' })
