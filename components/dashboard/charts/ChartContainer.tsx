'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { exportChart } from '@/lib/dashboard/exportChart'

interface ChartContainerProps {
  title: string
  children: ReactNode
  chartId: string
  filters?: ReactNode
  className?: string
}

export default function ChartContainer({
  title,
  children,
  chartId,
  filters,
  className = '',
}: ChartContainerProps) {
  const [dateRange, setDateRange] = useState('30d')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="p-6 hv-charts-card border border-[#c6a55a]/25 bg-[#07111f] text-[#f5f1e8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold tracking-tight text-[#f5f1e8]">{title}</h3>

          <div className="flex items-center gap-3">
            {filters || (
              <Select
                className="w-36 h-9 bg-[#0b1a2f] border-[#c6a55a]/30 text-[#f5f1e8] text-sm"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                aria-label="Date range"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              className="border-[#c6a55a]/40 text-[#c6a55a] hover:bg-[#c6a55a]/10"
              onClick={() => exportChart(chartId, 'png')}
            >
              Export
            </Button>
          </div>
        </div>

        <div id={chartId} className="relative">
          {children}
        </div>
      </Card>
    </motion.div>
  )
}
