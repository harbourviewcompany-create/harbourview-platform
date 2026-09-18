import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MissionWorkspace from './MissionWorkspace'
export const dynamic='force-dynamic'
export default async function MarketEntryPage(){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect('/login?next=/market-entry');return <MissionWorkspace/>}
