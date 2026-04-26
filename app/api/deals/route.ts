import {NextRequest,NextResponse} from 'next/server';
import {createDeal} from '@/lib/services/deals';
export async function POST(req:NextRequest){const body=await req.json();const res=await createDeal(body);return NextResponse.json(res);}