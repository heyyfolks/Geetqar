'use client'
import { useEffect, useState } from 'react'
export function AudioVisualizer(){const [bars,setBars]=useState<number[]>(Array(48).fill(10));useEffect(()=>{const id=setInterval(()=>setBars(Array.from({length:48},()=>8+Math.random()*42)),120);return()=>clearInterval(id)},[]);return <div className="flex h-16 items-center justify-center gap-[3px] overflow-hidden opacity-70">{bars.map((h,i)=><span key={i} className="w-[2px] rounded-full bg-gold transition-all duration-100" style={{height:`${h}%`}}/> )}</div>}
