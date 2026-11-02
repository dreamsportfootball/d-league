// 嘉義 235 FC actual-route portrait QA, separate from the generic component crop sheets.
// Capture the real TeamPage roster and 17 targeted PlayerPages at mobile and desktop widths.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { inspectPortraitCircle } from './portrait-circle-coverage.mjs';

const root=process.cwd(), out=path.join(root,'audit');
const base=(process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/,'');
const players=JSON.parse(await fs.readFile(path.join(root,'data/seasons/2026-27/players.json'),'utf8'))
  .filter(p=>p.teamId==='t_chiayi_235_2026' && [1,2,3,7,9,11,14,17,18,19,26,30,31,32,69,71,77].includes(p.number));
const teams=JSON.parse(await fs.readFile(path.join(root,'data/seasons/2026-27/teams.json'),'utf8'));
const team=teams.find(t=>t.id==='t_chiayi_235_2026');
if(players.length!==17||!team) throw Error('Chiayi 235 targeted portrait counts changed: review expected list');
const viewports=[{name:'mobile-390',width:390,height:844},{name:'desktop-1280',width:1280,height:900}];
const run={generatedAt:new Date().toISOString(),team:team.name,season:'2026-27',viewports:[],failures:[]};
const browser=await chromium.launch({headless:true});
const original=async p=>{
  const f=path.join(root,'public/assets/seasons/2026-27/players',p.id+'.png');
  const buf=await fs.readFile(f);
  return (await sharp(buf).rotate().resize(120,138,{fit:'contain',background:'white',withoutEnlargement:false}).png().toBuffer()).toString('base64');
};
const getImage=async (locator,expectedId,tag)=>{
  await locator.waitFor({state:'visible',timeout:18000});
  await locator.scrollIntoViewIfNeeded();
  const diag=await locator.evaluate(async image=>{
    await image.decode().catch(()=>{});
    const style=getComputedStyle(image),container=getComputedStyle(image.parentElement);
    const bounds=image.parentElement.getBoundingClientRect();
    return {src:image.currentSrc,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
      objectFit:style.objectFit,objectPosition:style.objectPosition,transform:style.transform,
      shape:container.borderRadius,overflowX:container.overflowX,overflowY:container.overflowY,
      width:bounds.width,height:bounds.height,alt:image.alt};
  });
  if(!diag.src.includes(expectedId)||!diag.naturalWidth||!diag.naturalHeight)
    throw Error(tag+': wrong/broken photo '+JSON.stringify(diag));
  const geometry=inspectPortraitCircle({width:diag.width,height:diag.height,
    transform:diag.transform,overflowX:diag.overflowX,overflowY:diag.overflowY,
    borderRadius:diag.shape,objectFit:diag.objectFit});
  diag.coverage=geometry;
  if(!geometry.passed)
    throw Error(tag+': image does not cover circular avatar '+JSON.stringify({diag,geometry}));
  const png=await locator.locator('xpath=..').screenshot({type:'png',animations:'disabled',timeout:15000});
  return {diagnostics:diag,png:png.toString('base64')};
};
const htmlEscape=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const renderSheet=async (entries,view)=>{
  const html='<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><style>'+
    'body{margin:0;padding:20px;background:#fff;color:#111;font-family:Arial,sans-serif}h1{font-size:23px;margin:0 0 5px}p{font-size:12px;margin:0 0 14px;color:#555}'+
    '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.item{height:233px;border:1px solid #ddd;padding:7px;text-align:center;box-sizing:border-box}'+
    '.images{height:153px;display:flex;align-items:center;justify-content:center;gap:10px}'+
    '.raw{width:120px;height:140px;object-fit:contain}.roster{width:48px;height:48px}.profile{width:90px;height:90px;object-fit:contain}'+
    'strong{display:block;font-size:15px}small{display:block;font-size:11px;color:#555;margin-top:4px}'+
    '</style></head><body><h1>嘉義 235 FC｜真實路由頭像驗收 '+htmlEscape(view.name)+'</h1>'+
    '<p>左：登錄原圖　中：球隊名單實際 48px　右：個人頁實際頭像（依畫面縮放呈現）。下列全部由實際 React 頁面截取。</p>'+
    '<div class="grid">'+entries.map(e=>'<div class="item"><div class="images">'+
      '<img class="raw" src="data:image/png;base64,'+e.raw+'">'+
      '<img class="roster" src="data:image/png;base64,'+e.roster.png+'">'+
      '<img class="profile" src="data:image/png;base64,'+e.profile.png+'">'+
      '</div><strong>'+htmlEscape(e.name)+'</strong><small>'+htmlEscape(e.id)+'｜'+htmlEscape(e.type)+
      '｜'+Math.round(e.profile.diagnostics.width)+'px 個人頭像</small></div>').join('')+'</div></body></html>';
  const sheet=await browser.newPage({viewport:{width:1220,height:1620},deviceScaleFactor:1});
  await sheet.setContent(html,{waitUntil:'load'});
  await sheet.screenshot({path:path.join(out,'chiayi235-actual-'+view.name+'.jpg'),type:'jpeg',quality:82,fullPage:true});
  await sheet.close();
};
try{
  for(const view of viewports){
    const ctx=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:1,locale:'zh-TW'});
    const page=await ctx.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
    const url=base+'/#/teams/t_chiayi_235_2026?season=2026-27';
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    const rosterSection=page.locator('section').filter({has:page.locator('h2', {hasText:'球員名單'})}).last();
    await rosterSection.waitFor({state:'visible',timeout:20000});
    const rawLinks=await rosterSection.locator('a[aria-label^="查看"]').evaluateAll(els=>els.map(el=>({label:el.getAttribute('aria-label'),href:el.getAttribute('href')})));
    if(rawLinks.length!==20)throw Error(view.name+': full team roster expected 20 links, got '+rawLinks.length);
    const teamOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    if(teamOverflow)run.failures.push({view:view.name,route:'team',problem:'horizontal overflow'});
    const rosterMap=new Map();
    for(const p of players){
      const link=rosterSection.locator('a[aria-label="查看 '+p.name+' 球員個人資料"]');
      if(await link.count()!==1)throw Error('Team list missing '+p.name);
      rosterMap.set(p.id,{...await getImage(link.locator('img'),p.id,'roster '+p.name),href:await link.getAttribute('href')});
    }
    // All 17 targeted roster portraits have now been decoded and element-checked.
    // Capture the full real page from the top; crop the actual roster's page-coordinate box.
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(180);
    const rosterRegion=await rosterSection.evaluate(el=>({top:Math.round(el.getBoundingClientRect().top+window.scrollY),height:Math.round(el.getBoundingClientRect().height)}));
    const fullPage=await page.screenshot({type:'jpeg',quality:77,fullPage:true,animations:'disabled'});
    const metadata=await sharp(fullPage).metadata();
    if(rosterRegion.height<=0||rosterRegion.top<0||rosterRegion.top>=metadata.height)throw Error(view.name+': invalid roster region');
    await sharp(fullPage).extract({left:0,top:rosterRegion.top,width:Math.min(view.width,metadata.width),height:Math.min(rosterRegion.height,metadata.height-rosterRegion.top)})
      .jpeg({quality:82}).toFile(path.join(out,'chiayi235-roster-'+view.name+'.jpg'));
    const entries=[];
    for(const p of players){
      const l=rosterMap.get(p.id);
      await page.goto(new URL(l.href,url).href,{waitUntil:'domcontentloaded',timeout:25000});
      const profileImg=page.locator('img[alt="'+p.name+'"]').first();
      const profile=await getImage(profileImg,p.id,'profile '+p.name);
      if(!await page.locator('h1').filter({hasText:p.name}).count())throw Error('Wrong profile title '+p.name);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
      if(overflow)run.failures.push({view:view.name,route:'player '+p.id,problem:'horizontal overflow'});
      entries.push({name:p.name,id:p.id,type:'球員',raw:await original(p),roster:l,profile});
      run.viewports.push({view:view.name,route:'player',id:p.id,name:p.name,roster:l.diagnostics,profile:profile.diagnostics,overflow});
    }
    if(errors.length)run.failures.push({view:view.name,route:'browser',problem:errors.slice(0,10)});
    await renderSheet(entries,view);
    await ctx.close();
  }
}finally{await browser.close()}
await fs.writeFile(path.join(out,'chiayi235-actual-route-review.json'),JSON.stringify(run,null,2)+'\n');
console.log(JSON.stringify({routes:run.viewports.length,failures:run.failures,images:['chiayi235-actual-mobile-390.jpg','chiayi235-actual-desktop-1280.jpg']},null,2));
if(run.failures.length)process.exitCode=1;
