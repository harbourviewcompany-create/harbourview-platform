import type React from 'react'
import type CommandCentre from '../CommandCentre'

/** Shared compile-time prop contract for desktop and rebuilt mobile shells. */
export type MobileCommandCentreProps = React.ComponentProps<typeof CommandCentre>
