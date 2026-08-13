import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false}}):null}
async function admin(){const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();const email=process.env.GEETQAR_ADMIN_EMAIL?.trim().toLowerCase();return user?.email?.toLowerCase()===email}

export async function GET(){
 if(!(await admin()))return NextResponse.json({error:'Unauthorized.'},{status:401})
 const client=db();if(!client)return NextResponse.json({error:'Service role is not configured.'},{status:503})
 const {data,error}=await client.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(200)
 if(error)return NextResponse.json({error:error.message},{status:500})
 return NextResponse.json({messages:data||[]},{headers:{'Cache-Control':'no-store'}})
}

export async function PATCH(req:Request){
 if(!(await admin()))return NextResponse.json({error:'Unauthorized.'},{status:401})
 const client=db();if(!client)return NextResponse.json({error:'Service role is not configured.'},{status:503})
 const body=await req.json().catch(()=>null);const id=typeof body?.id==='string'?body.id.trim():'';const status=body?.status
 if(!id||!['new','read','replied','archived'].includes(status))return NextResponse.json({error:'Invalid contact update.'},{status:400})
 const {error}=await client.from('contact_messages').update({status}).eq('id',id)
 if(error)return NextResponse.json({error:error.message},{status:500})
 return NextResponse.json({ok:true})
}
