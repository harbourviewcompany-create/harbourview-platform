/* eslint-disable */
// @ts-nocheck
'use client'

import { panelCss } from '@/components/admin/panels/shared'
import { ClinicalPanel } from '@/components/admin/panels/ClinicalPanel'

export default function Page() {
  return (
    <>
      <style>{panelCss}</style>
      <div className="hv-app"><div className="hv-main"><div className="content">
        <ClinicalPanel />
      </div></div></div>
    </>
  )
}
