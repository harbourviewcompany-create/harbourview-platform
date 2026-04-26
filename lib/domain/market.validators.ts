import { z } from 'zod';

export const CounterpartyTypeSchema = z.enum([
  'buyer',
  'seller',
  'investor',
  'operator',
  'distributor',
  'pharmacy',
  'processor',
  'supplier',
  'other',
]);

export const CounterpartyStatusSchema = z.enum(['active', 'watchlist', 'blocked', 'archived']);
export const DealStatusSchema = z.enum(['open', 'qualified', 'negotiation', 'closed', 'lost', 'archived']);

export const CounterpartySchema = z.object({
  name: z.string().trim().min(2).max(180),
  type: CounterpartyTypeSchema,
  jurisdiction: z.string().trim().max(120).optional().nullable(),
  website: z.string().trim().url().optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  status: CounterpartyStatusSchema.default('active'),
});

export const DealSchema = z.object({
  title: z.string().trim().min(3).max(240),
  status: DealStatusSchema.default('open'),
  counterparty_id: z.string().uuid().optional().nullable(),
  signal_id: z.string().uuid().optional().nullable(),
  value_estimate: z.number().nonnegative().optional().nullable(),
  priority: z.number().int().min(1).max(5).default(3),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const DealTransitionSchema = z.object({
  status: DealStatusSchema,
  note: z.string().trim().max(2000).optional(),
});

export type CounterpartyInput = z.infer<typeof CounterpartySchema>;
export type DealInput = z.infer<typeof DealSchema>;
export type DealTransitionInput = z.infer<typeof DealTransitionSchema>;
