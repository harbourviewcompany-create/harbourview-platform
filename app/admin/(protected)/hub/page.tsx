/* eslint-disable */
// @ts-nocheck
'use client'

import { useMemo, useState } from 'react'
import { mkApi, panelCss, useAdminToast } from '@/components/admin/panels/shared'
import { Overview } from '@/components/admin/panels/Overview'

export default function Page() {
  const api = useMemo(() => mkApi(), [])
  const { toast, toastNode } = useAdminToast()
  const [stats, setStats] = useState(null)
  return (
    <>
      <style>{panelCss}</style>
      <div className="hv-app"><div className="hv-main"><div className="content">
        <Overview api={api} toast={toast} stats={stats} setStats={setStats} />
      </div></div></div>
      {toastNode}
    </>
  )
}
