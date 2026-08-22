/* eslint-disable */
// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { mkApi, panelCss, useAdminToast } from '@/components/admin/panels/shared'
import { Actions } from '@/components/admin/panels/Actions'

export default function Page() {
  const api = useMemo(() => mkApi(), [])
  const { toast, toastNode } = useAdminToast()
  return (
    <>
      <style>{panelCss}</style>
      <div className="hv-app"><div className="hv-main"><div className="content">
        <Actions api={api} toast={toast} />
      </div></div></div>
      {toastNode}
    </>
  )
}
