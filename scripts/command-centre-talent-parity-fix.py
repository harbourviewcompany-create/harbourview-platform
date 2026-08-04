from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    file.write_text(text.replace(old, new, 1))


command_centre = 'components/dashboard/CommandCentre.tsx'
replace_once(
    command_centre,
    """      { id: 'events',  label: 'Events',          icon: '◷' },
      { id: 'jobs',    label: 'Jobs Board',      icon: '◉' },
      { id: 'experts', label: 'Expert Directory', icon: '⊚' },
""",
    """      { id: 'events',  label: 'Events',           icon: '◷' },
      { id: 'jobs',    label: 'Jobs Board',       icon: '◉' },
      { id: 'talent',  label: 'Talent',           icon: '◇' },
      { id: 'experts', label: 'Expert Directory', icon: '⊚' },
""",
)
replace_once(
    command_centre,
    """      case 'jobs':
        return <JobsBoardPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'notifications':
""",
    """      case 'jobs':
      case 'talent':
        return <JobsBoardPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'notifications':
""",
)

spec = 'tests/e2e/mobile-command-centre-v2.spec.ts'
replace_once(
    spec,
    """              await expect(page.locator('.cc-app:visible')).toBeVisible()
              expect(new URL(page.url()).searchParams.get('page')).toBe(commandPage)
              verifiedPages.push(commandPage)
""",
    """              const commandRoot = page.locator('.cc-app:visible')
              await expect(commandRoot).toBeVisible()
              expect(new URL(page.url()).searchParams.get('page')).toBe(commandPage)
              await expect(commandRoot.locator('.cc-main')).not.toBeEmpty()
              await expect(commandRoot.locator('.cc-main')).toContainText(/\S/)
              verifiedPages.push(commandPage)
""",
)
