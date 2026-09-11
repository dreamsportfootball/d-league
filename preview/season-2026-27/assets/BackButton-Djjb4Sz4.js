import{c as h,B as d,j as n}from"./index-D8oJ7Qcq.js";import{A as p}from"./arrow-left-BfbqCNfm.js";/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],y=h("user-round",f),e=()=>{const t=window.history.state;return typeof(t==null?void 0:t.idx)=="number"&&t.idx>0},l=t=>{const s=t.split(/[?#]/,1)[0];return s==="/"?"返回首頁":s.startsWith("/standings")?"返回積分榜":s.startsWith("/stats")?"返回數據中心":s.startsWith("/news")?"返回最新消息":s.startsWith("/schedule")?"返回賽程與結果":s.startsWith("/teams/")?"返回球隊":"返回上一頁"},B=({fallbackTo:t,label:s="返回上一頁",fallbackLabel:a,className:i="",iconClassName:c="mr-2 h-4 w-4"})=>{const r=d(),o=e()?s:a??l(t),u=()=>{if(e()){r(-1);return}r(t)};return n.jsxs("button",{type:"button",onClick:u,className:i,children:[n.jsx(p,{className:c,"aria-hidden":"true"}),o]})};export{B,y as U};
