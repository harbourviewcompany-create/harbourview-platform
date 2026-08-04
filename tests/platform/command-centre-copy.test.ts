import { describe, expect, it } from 'vitest'
import { COMMAND_CENTRE_COPY, MOBILE_COMMAND_COPY } from '@/lib/platform/commandCentreCopy'

describe('Command Centre controlled copy', () => {
  it('uses one versioned copy contract for reliability and mobile controls', () => {
    expect(MOBILE_COMMAND_COPY).toBe(COMMAND_CENTRE_COPY.mobile)
    expect(COMMAND_CENTRE_COPY.dataBoundary.error).toMatch(/temporarily unavailable/i)
    expect(MOBILE_COMMAND_COPY.controlDetail).toMatch(/No supplier identity/i)
    expect(MOBILE_COMMAND_COPY.financingInquiryDescription).toMatch(/does not approve credit/i)
  })
})
