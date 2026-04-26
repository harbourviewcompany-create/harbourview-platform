import {getScopedSupabase} from '@/lib/queries/_shared';
export async function ingestSignal(input:any){const {supabase}=await getScopedSupabase();return supabase.from('signals').insert(input);}