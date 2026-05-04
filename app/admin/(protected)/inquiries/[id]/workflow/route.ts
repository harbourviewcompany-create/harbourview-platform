import { NextResponse } from 'next/server';
import { applyInquiryWorkflowUpdate } from '@/app/actions/updateInquiryStatus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  await applyInquiryWorkflowUpdate(id, formData);
  return NextResponse.redirect(new URL(`/admin/inquiries/${id}`, request.url), { status: 303 });
}
