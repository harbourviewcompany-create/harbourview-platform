'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
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

interface TimelineDataPoint {
  date: string;
  signals: number;
  score: number;
  country?: string;
  type?: 'regulatory' | 'opportunity' | 'market';
  id?: string;
}

interface InteractiveTimelineProps {
  data?: TimelineDataPoint[];
}

export default function InteractiveTimeline({ data = [] }: InteractiveTimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const routeToOpportunity = useRouteToOpportunity();
  const [selectedPoint, setSelectedPoint] = useState<TimelineDataPoint | null>(null);

  const memoizedData = useMemo(() => data, [data]);

  const handleClick = (payload: any) => {
    if (payload?.activePayload?.[0]?.payload) {
      setSelectedPoint(payload.activePayload[0].payload);
    }
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={memoizedData} onClick={handleClick}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '6px',
            }}
          />
          <Line
            type="monotone"
            dataKey="signals"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <AnimatePresence mode="wait">
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="p-4 bg-muted rounded-lg border"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{selectedPoint.date}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Signals: {selectedPoint.signals} · Score: {selectedPoint.score}
                </p>
                {selectedPoint.country && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedPoint.country}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => routeToOpportunity(selectedPoint)}
                >
                  Route Opportunity
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedPoint(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
