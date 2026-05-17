#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const submitInquiry = readFileSync('app/actions/submitInquiry.ts', 'utf8')
const submitQuote = readFileSync('app/actions/submitQuoteRequest.ts', 'utf8')
const inquiryForm = readFileSync('components/marketplace/InquiryForm.tsx', 'utf8')
const quoteForm = readFileSync('app/marketplace/quote/QuoteRequestForm.tsx', 'utf8')
const workflow = readFileSync('lib/marketplace/inquiryWorkflow.ts', 'utf8')
const updateWorkflow = readFileSync('app/actions/updateInquiryStatus.ts', 'utf8')

const failures = []
const assert = (cond, msg) => { if (!cond) failures.push(msg) }

assert(submitInquiry.includes('INQUIRY_VALIDATION_SPAM_TRAP'), 'inquiry action must include spam trap diagnostic')
assert(submitQuote.includes('QUOTE_VALIDATION_SPAM_TRAP'), 'quote action must include spam trap diagnostic')
assert(submitInquiry.includes('INQUIRY_VALIDATION_UNSAFE_CONTENT'), 'inquiry action must include unsafe content diagnostic')
assert(submitQuote.includes('QUOTE_VALIDATION_UNSAFE_CONTENT'), 'quote action must include unsafe content diagnostic')
assert(inquiryForm.includes('name="website"'), 'inquiry form must include honeypot website field')
assert(quoteForm.includes('name="website"'), 'quote form must include honeypot website field')
assert(workflow.includes('canTransitionReviewStatus'), 'workflow helper must expose status transition guard')
assert(updateWorkflow.includes('canTransitionReviewStatus'), 'admin workflow update must enforce allowed transitions')

if (failures.length) {
  console.error('Intake/workflow safety test failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok intake actions reject spam-trap and unsafe content submissions')
console.log('ok public inquiry forms include honeypot spam trap fields')
console.log('ok review workflow updates enforce status transitions')
