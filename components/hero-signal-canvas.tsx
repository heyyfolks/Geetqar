'use client'
import { useEffect, useRef } from 'react'

export function HeroSignalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let width=0,height=0,dpr=1,frame=0,t=0
    const pointer={x:.5,y:.5,active:false}
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.floor(width*dpr));canvas.height=Math.max(1,Math.floor(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0)}
    const move=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();pointer.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));pointer.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));pointer.active=true}
    const leave=()=>{pointer.active=false}
    const draw=()=>{t+=reduced?0:.008;const energy=Math.max(0,Math.min(1,Number(getComputedStyle(document.documentElement).getPropertyValue('--geetqar-energy'))||0));const cx=width*(.5+(pointer.x-.5)*.11),cy=height*(.5+(pointer.y-.5)*.11),base=Math.min(width,height)*(.19+energy*.035);ctx.clearRect(0,0,width,height)
      const glow=ctx.createRadialGradient(cx,cy,2,cx,cy,Math.min(width,height)*.55);glow.addColorStop(0,'rgba(215,255,63,.13)');glow.addColorStop(.38,'rgba(215,255,63,.045)');glow.addColorStop(1,'rgba(215,255,63,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height)
      for(let layer=0;layer<7;layer++){const phase=t*(.5+layer*.035)+layer*.7;ctx.beginPath();for(let i=0;i<=240;i++){const a=i/240*Math.PI*2,harmonic=Math.sin(a*(3+layer%3)+phase*1.5)*(.008+energy*.04),ripple=Math.cos(a*7-phase*1.2)*(.006+energy*.018),r=base*(.42+layer*.145)+base*(harmonic+ripple),x=cx+Math.cos(a)*r*(1+Math.sin(phase)*.045),y=cy+Math.sin(a)*r*.77;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.strokeStyle=`rgba(215,255,63,${.11+layer*.018+energy*.12})`;ctx.lineWidth=layer===0?1.4+energy*2:.65;ctx.stroke()}
      for(let i=0;i<84;i++){const angle=i*2.39996+t*(.08+(i%5)*.012),radius=base*(.42+((i*37)%100)/100*2.15)*(1+energy*.12),x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius*.72,size=.6+((i*7)%4)*.24+energy*1.3;ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fillStyle=`rgba(244,255,198,${.19+energy*.35})`;ctx.fill()}
      ctx.beginPath();for(let i=0;i<=180;i++){const x=i/180*width,dist=Math.abs(i-90)/90,amp=(height*.035+energy*height*.16)*(1-dist*.72),y=height*.5+Math.sin(i*.19-t*7)*amp+Math.sin(i*.047+t*3)*amp*.38;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=`rgba(215,255,63,${.2+energy*.42})`;ctx.lineWidth=1;ctx.stroke()
      if(!reduced)frame=requestAnimationFrame(draw)}
    resize();draw();window.addEventListener('resize',resize);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave)
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave)}
  },[])
  return <canvas ref={canvasRef} className="gq-signal-canvas" aria-label="Animated GEETQAR frequency field" role="img" />
}
