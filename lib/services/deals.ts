import {getScopedSupabase} from '@/lib/queries/_shared';
export async function createDeal(input:any){const {supabase}=await getScopedSupabase();return supabase.from('deals').insert(input);}