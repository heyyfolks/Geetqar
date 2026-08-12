import {createClient} from '@sanity/client'
export const sanity=createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'',dataset:process.env.NEXT_PUBLIC_SANITY_DATASET||'production',apiVersion:process.env.NEXT_PUBLIC_SANITY_API_VERSION||'2026-08-12',useCdn:true})
export const siteQuery=`*[_type=="siteSettings"][0]{artistName,tagline,heroText,socials}`
export const tracksQuery=`*[_type=="track"]|order(releaseDate desc){_id,title,slug,releaseDate,coverArt,masterUrl}`
export const pinnedTopicQuery=`*[_type=="pinnedTopic" && active==true]|order(_createdAt desc)[0]{title,body,track}`
