'use client';

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportChart } from '@/lib/dashboard/exportChart';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  chartId: string;
  filters?: ReactNode;
  className?: string;
}

export default function ChartContainer({
  title,
  children,
  chartId,
  filters,
  className = '',
}: ChartContainerProps) {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>

          <div className="flex items-center gap-3">
            {filters || (
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
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
  );
}
