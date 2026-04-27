import { z } from 'zod'
import { VISITOR_TYPES, OBJECTIVES, PREFERRED_NEXT_STEPS } from './constants'

export const intakeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('A valid email is required'),
  company: z.string().min(1, 'Company is required').max(200),
  role: z.string().min(1, 'Role is required').max(100),
  visitorType: z.string().refine((v) => (VISITOR_TYPES as readonly string[]).includes(v), {
    message: 'Please select your organization type',
  }),
  objective: z.string().refine((v) => (OBJECTIVES as readonly string[]).includes(v), {
    message: 'Please select your primary objective',
  }),
  targetMarket: z.string().min(1, 'Target market or region is required').max(300),
  preferredNextStep: z.string().refine((v) => (PREFERRED_NEXT_STEPS as readonly string[]).includes(v), {
    message: 'Please select a preferred next step',
  }),
  phone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  linkedin: z.string().max(200).optional().or(z.literal('')),
  timeline: z.string().max(300).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  _hp: z.string().optional(),
  _ts: z.number().optional(),
})

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('A valid email is required'),
  company: z.string().min(1, 'Company is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(3000),
  phone: z.string().max(50).optional().or(z.literal('')),
  _hp: z.string().optional(),
  _ts: z.number().optional(),
})

export type IntakeFormData = z.infer<typeof intakeSchema>
export type ContactFormData = z.infer<typeof contactSchema>
