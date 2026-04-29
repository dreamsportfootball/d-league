import{c as u,u as p,r as l,j as e,L as c,f as b}from"./index-Dm-Syowi.js";/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],f=u("arrow-left",h),g={"Match Report":{label:"Match Report",subLabel:"賽事戰報"},Official:{label:"Official",subLabel:"官方公告"}},j={subLabel:"最新消息"},w=r=>r==="Match Report"||r==="戰報"?"bg-brand-accent text-brand-black border-transparent":r==="Official"||r==="公告"?"bg-brand-blue text-white border-transparent":"bg-neutral-100 text-neutral-600 border-transparent",N=r=>{const t=new Date(r);if(Number.isNaN(t.getTime()))return"";const a=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${a}.${n}.${s}`},y=({text:r})=>{if(!r)return null;const t=r.split(/\n{2,}/).map(a=>a.trim()).filter(a=>a.length>0);return t.length===0?null:e.jsxs("div",{className:"text-[15px] md:text-[16px] leading-[2.2] text-neutral-800 font-light md:font-medium text-justify",children:[e.jsx("div",{className:`\r
          mb-10 \r
          pl-4 md:pl-5 \r
          border-l-[3px] border-[#0047AB] \r
          text-[18px] md:text-[20px] \r
          leading-[1.7] \r
          font-semibold\r
          font-display\r
          text-black \r
          tracking-wide\r
          whitespace-pre-line\r
        `,children:t[0]}),t.slice(1).map((a,n)=>e.jsx("p",{className:"mb-8 tracking-wide whitespace-pre-line",children:a},n))]})},A=()=>{const{id:r}=p(),[t,a]=l.useState(null),[n,s]=l.useState(!0);if(l.useEffect(()=>{(async()=>{try{const m=(await b()).find(x=>x.id===r)||null;a(m)}catch(i){console.error("Failed to load article:",i),a(null)}finally{s(!1)}})()},[r]),n)return e.jsx("div",{className:"min-h-screen bg-white flex items-center justify-center",children:e.jsx("div",{className:"w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"})});if(!t)return e.jsxs("div",{className:"min-h-screen bg-white pt-32 px-6 text-center",children:[e.jsx("h1",{className:"text-xl font-medium tracking-widest text-neutral-900 mb-4",children:"文章不存在"}),e.jsx(c,{to:"/news",className:"text-xs tracking-[0.2em] text-neutral-400 hover:text-black transition-colors border-b border-transparent hover:border-black pb-1",children:"返回首頁"})]});const o=g[t.category]||j,d=t.content||t.summary||"";return e.jsx("article",{className:"min-h-screen bg-white pt-14 md:pt-24 pb-32",children:e.jsxs("div",{className:"max-w-3xl mx-auto px-6 md:px-8",children:[e.jsx("div",{className:"mb-6 md:mb-8",children:e.jsxs(c,{to:"/news",className:"inline-flex items-center group text-[11px] md:text-[12px] tracking-[0.15em] text-neutral-400 hover:text-black transition-colors",children:[e.jsx(f,{className:"w-3 h-3 mr-2 transition-transform group-hover:-translate-x-1"}),"返回最新消息"]})}),e.jsxs("header",{className:"mb-12 md:mb-16 flex flex-col items-start text-left",children:[e.jsxs("div",{className:"flex flex-row items-center gap-3 mb-6 md:mb-8",children:[e.jsx("span",{className:`
                text-[12px] tracking-[0.1em] font-bold px-2 py-1 rounded-sm
                ${w(t.category)}
              `,children:o.subLabel}),e.jsx("span",{className:"text-[11px] font-mono text-neutral-400 tracking-wider",children:N(t.timestamp)})]}),e.jsx("h1",{className:`\r
              font-display font-bold uppercase\r
              text-[26px] md:text-[34px] \r
              leading-[1.2] tracking-wider \r
              text-neutral-900 mb-4 md:mb-5\r
            `,children:t.title}),t.summary&&e.jsx("p",{className:"text-[13px] md:text-[14px] leading-relaxed text-neutral-500 tracking-wide mb-6 md:mb-7",children:t.summary}),e.jsx("div",{className:"w-10 h-[1px] bg-neutral-300"})]}),t.imageUrl&&e.jsx("figure",{className:"mb-8 md:mb-10",children:e.jsx("div",{className:"w-full bg-neutral-100 overflow-hidden",children:e.jsx("img",{src:t.imageUrl,alt:t.title,className:"w-full h-auto block grayscale-[10%] hover:grayscale-0 transition-all duration-700"})})}),e.jsx("div",{className:"mx-auto max-w-[680px]",children:e.jsx(y,{text:d})}),e.jsx("div",{className:"mt-24 flex justify-center opacity-30 grayscale hover:grayscale-0 transition-all duration-500",children:e.jsx("img",{src:"https://cdn.store-assets.com/s/783745/f/16299215.png",alt:"End of Article",className:"w-12 h-auto object-contain"})})]})})};export{A as default};
