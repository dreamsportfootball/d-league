import{c as o,r as c,j as n}from"./index-CHGcHyWO.js";/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],u=o("user-round",i),h=({src:e,name:t,large:r=!1})=>{const[s,l]=c.useState(null),a=!!(e&&e!==s);return n.jsx("div",{className:r?"flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200 sm:h-32 sm:w-32 lg:h-40 lg:w-40":"flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200",children:a?n.jsx("img",{src:e,alt:t+" 大頭貼",loading:r?"eager":"lazy",decoding:"async",className:"h-full w-full object-cover",onError:()=>l(e??null)}):n.jsx(u,{"aria-hidden":"true",className:r?"h-12 w-12 text-neutral-300 sm:h-14 sm:w-14 lg:h-16 lg:w-16":"h-6 w-6 text-neutral-400"})})};export{h as S,u as U};
