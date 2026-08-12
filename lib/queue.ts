import { createClient } from '@supabase/supabase-js'

export type QueueItem = { id:string; track_id:string; username:string; votes:number; status:'queued'|'playing'|'played'; created_at:string }

export function supabase(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key) throw new Error('Supabase environment variables are missing');return createClient(url,key)}

export async function voteForQueueItem(queueId:string, voterId:string){const {data,error}=await supabase().rpc('vote_queue_item',{p_queue_id:queueId,p_voter_id:voterId});if(error) throw error;return data}

export async function getNextTrack(){const {data,error}=await supabase().rpc('claim_next_queue_item');if(error) throw error;return data}
