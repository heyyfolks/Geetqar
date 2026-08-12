import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'
export async function POST(req:Request){
 const secret=process.env.GEETQAR_ADMIN_SECRET
 if(!secret||req.headers.get('x-geetqar-admin-secret')!==secret)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {fileName}=await req.json(); if(typeof fileName!=='string'||!/^.+\.(wav|flac)$/i.test(fileName))return NextResponse.json({error:'Only WAV/FLAC allowed'},{status:400})
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return NextResponse.json({error:'Storage is not configured'},{status:503})
 const db=createClient(url,key,{auth:{persistSession:false}});const path=`masters/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g,'_')}`
 const {data,error}=await db.storage.from('masters').createSignedUploadUrl(path)
 if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({path,token:data.token})
}
