/* eslint-disable */
// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { panelCss, useAdminToast } from '@/components/admin/panels/shared'
import { Stripe } from '@/components/admin/panels/Stripe'

export default function Page() {
  const { toast, toastNode } = useAdminToast()
  return (
    <>
      <style>{panelCss}</style>
      <div className="hv-app"><div className="hv-main"><div className="content">
        <Stripe toast={toast} />
      </div></div></div>
      {toastNode}
    </>
  )
}
