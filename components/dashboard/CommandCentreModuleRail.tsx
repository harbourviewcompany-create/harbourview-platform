'use client'

import Link from 'next/link'
import {
  buildCommandCentreHref,
  COMMAND_CENTRE_MODULE_REGISTRY,
} from '@/lib/platform/commandCentreRegistry'
import './CommandCentreModuleRail.css'

export default function CommandCentreModuleRail({
  country,
  role,
}: {
  country: string | null
  role: string | null
}) {
  const launchCritical = COMMAND_CENTRE_MODULE_REGISTRY.filter(module => module.criticality === 'launch-critical')
  const important = COMMAND_CENTRE_MODULE_REGISTRY.filter(module => module.criticality === 'important')

  return (
    <details className="hv-module-rail">
      <summary>
        <span>All Command Centre modules</span>
        <small>{COMMAND_CENTRE_MODULE_REGISTRY.length} available</small>
      </summary>
      <nav aria-label="Complete Command Centre module directory">
        <section aria-labelledby="hv-launch-modules">
          <h2 id="hv-launch-modules">Core operations</h2>
          <div className="hv-module-rail-grid">
            {launchCritical.map(module => (
              <Link
                key={module.id}
                href={buildCommandCentreHref(module.id, { country, role })}
                data-command-module={module.id}
              >
                <strong>{module.label}</strong>
                <span>{module.desktopPage.replace(/-/g, ' ')}</span>
              </Link>
            ))}
          </div>
        </section>
        <section aria-labelledby="hv-supporting-modules">
          <h2 id="hv-supporting-modules">Supporting operations</h2>
          <div className="hv-module-rail-grid">
            {important.map(module => (
              <Link
                key={module.id}
                href={buildCommandCentreHref(module.id, { country, role })}
                data-command-module={module.id}
              >
                <strong>{module.label}</strong>
                <span>{module.desktopPage.replace(/-/g, ' ')}</span>
              </Link>
            ))}
          </div>
        </section>
      </nav>
    </details>
  )
}
