'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouteToOpportunity } from '@/lib/dashboard/routeToOpportunity';

interface DrillDownData {
  country: string;
  score: number;
  signals: number;
  riskLevel?: 'low' | 'medium' | 'high';
  trend?: 'up' | 'down' | 'stable';
  id?: string;
}

interface DrillDownBarChartProps {
  data?: DrillDownData[];
}

export default function DrillDownBarChart({ data = [] }: DrillDownBarChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const routeToOpportunity = useRouteToOpportunity();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const memoizedData = useMemo(() => data, [data]);

  const handleBarClick = (entry: any) => {
    if (!entry?.payload?.country) return;
    const country = entry.payload.country;
    setSelectedCountry(country);
    // In production this would call a real data fetcher
    setFilteredData([
      {
        signalType: 'Regulatory Update',
        trend: entry.payload.trend || 'stable',
        country,
        score: entry.payload.score,
      },
      {
        signalType: 'Market Opportunity',
        trend: 'up',
        country,
        score: entry.payload.score,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={memoizedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="country" />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '6px',
            }}
          />
          <Bar
            dataKey="score"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ResponsiveContainer>

      <AnimatePresence mode="wait">
        {selectedCountry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            className="border-t pt-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Details for {selectedCountry}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCountry(null)}
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredData.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: shouldReduceMotion ? 0 : index * 0.05,
                  }}
                  className="p-4 bg-muted rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{item.signalType}</span>
                    <Badge
                      variant={item.trend === 'up' ? 'default' : 'secondary'}
                    >
                      {item.trend}
                    </Badge>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => routeToOpportunity(item)}
                  >
                    Route Opportunity
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
