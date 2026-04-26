import {getScopedSupabase} from '@/lib/queries/_shared';
import {DealSchema} from '@/lib/domain/market.validators';

async function audit(supabase:any,entity_type:string,entity_id:string,action:string,payload:any){
  await supabase.from('market_audit_events').insert({entity_type,entity_id,action,payload});
}

export async function createDeal(input:any){
  const parsed=DealSchema.safeParse(input);
  if(!parsed.success){throw new Error('invalid deal input');}
  const {supabase}=await getScopedSupabase();
  const {data,error}=await supabase.from('deals').insert(parsed.data).select().single();
  if(error) throw error;
  await audit(supabase,'deal',data.id,'create',parsed.data);
  return data;
}
