// Second-batch, read-only real-route portrait QA. Capture real 48px roster + 104/160px profile and compare against original.
// Five teams follow the previous KUROMI → Niaoshi/SF/KA/Tongque/Wolves batch.
// Capture the real TeamPage roster and every PlayerPage / StaffPage at mobile and desktop widths.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright';

const root=process.cwd(), out=path.join(root,'audit');
const base=(process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/d-league').replace(/\/$/,'');
const teamId=process.env.TEAM_ID;
const players=JSON.parse(await fs.readFile(path.join(root,'data/seasons/2026-27/players.json'),'utf8'))
  .filter(p=>p.teamId===teamId);
const teams=JSON.parse(await fs.readFile(path.join(root,'data/seasons/2026-27/teams.json'),'utf8'));
const team=teams.find(t=>t.id===teamId);
if(!team || !players.length || !['t_kaohsiung_hk_2026','t_pingtung_wild_ape_2026','t_chen_2026','t_tainan_evergreen_2026','t_black_wolf_2026'].includes(teamId)) throw Error('Unexpected TEAM_ID '+teamId);
const staff=[...new Map(team.staff.map(s=>[s.identityId??s.id??s.name,s])).values()];
const images=JSON.parse(await fs.readFile(path.join(root,'data/seasons/2026-27/playerImages.json'),'utf8'));
const historicImages=JSON.parse(await fs.readFile(path.join(root,'data/seasons/2025-26/playerImages.json'),'utf8'));
const photoForPlayer=p=>images[p.name]??(p.id==='pwa26-01'?historicImages['邱文良']:undefined);
const photoForStaff=s=>s.image??images[s.name]??(s.name==='邱文良'?historicImages[s.name]:undefined);
const short='next-'+team.id.replace(/^t_/,'').replace(/_2026$/,'').replaceAll('_','-');
const viewports=[{name:'mobile-390',width:390,height:844},{name:'desktop-1280',width:1280,height:900}];
const run={generatedAt:new Date().toISOString(),team:team.name,teamId,season:'2026-27',playerCount:players.length,staffRecords:team.staff.length,distinctStaff:staff.length,viewports:[],failures:[]};
const browser=await chromium.launch({headless:true});
const original=async photo=>{
  const f=path.join(root,'public',photo.replace(/^\/+/,''));
  const buf=await fs.readFile(f);
  return (await sharp(buf).rotate().resize(120,138,{fit:'contain',background:'white',withoutEnlargement:false}).png().toBuffer()).toString('base64');
};
const getImage=async (locator,expectedId,tag)=>{
  await locator.waitFor({state:'visible',timeout:18000});
  // Native 'ifNeeded' scrolling sometimes places a roster avatar behind the sticky
  // header. Center the actual avatar so 48px screenshots contain only its photo.
  await locator.evaluate(image=>image.parentElement.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
  await locator.page().waitForTimeout(100);
  const unobstructed=await locator.evaluate(image=>{
    const box=image.parentElement.getBoundingClientRect();
    const hit=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
    return Boolean(hit && image.parentElement.contains(hit));
  });
  if(!unobstructed)throw Error(tag+': circular portrait obscured by header/overlay');
  const diag=await locator.evaluate(async image=>{
    await image.decode().catch(()=>{});
    const style=getComputedStyle(image),container=getComputedStyle(image.parentElement);
    const bounds=image.parentElement.getBoundingClientRect();
    return {src:image.currentSrc,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
      objectFit:style.objectFit,objectPosition:style.objectPosition,transform:style.transform,
      shape:container.borderRadius,width:bounds.width,height:bounds.height,alt:image.alt};
  });
  if(!decodeURIComponent(diag.src).includes(expectedId)||!diag.naturalWidth||!diag.naturalHeight)
    throw Error(tag+': wrong/broken photo '+JSON.stringify(diag));
  if(diag.objectFit!=='cover'||diag.width<46)
    throw Error(tag+': wrong face container '+JSON.stringify(diag));
  // Earlier QA only checked successful decoding. Verify that image-specific
  // framing is actually applied (including optimized .webp assets).
  if(expectedId==='khk26-02' && diag.transform==='none')
    throw Error(tag+': KA HK face framing override did not apply');
  if(expectedId==='bw26-01' && diag.objectPosition!=='50% 22%')
    throw Error(tag+': Black Wolf #1 image position override did not apply: '+diag.objectPosition);
  if(expectedId==='bw26-02' && diag.objectPosition!=='50% 0%')
    throw Error(tag+': Black Wolf #2 image position override did not apply: '+diag.objectPosition);
  if(expectedId==='bw26-07' && (diag.objectPosition!=='50% 18%' || diag.naturalWidth<400))
    throw Error(tag+': Black Wolf #7 Excel original/WebP not applied: '+JSON.stringify(diag));
  if(expectedId==='bw26-10' && (diag.objectPosition!=='50% 12%' || diag.naturalWidth<600))
    throw Error(tag+': Black Wolf #20 Excel original/WebP not applied: '+JSON.stringify(diag));
  // Original Excel images must actually be used. The previous .png files shared
  // the same .webp output name and could silently win over higher-res JPEGs.
  if(expectedId==='bw26-07' && diag.naturalWidth < 400)
    throw Error(tag+': #7 old low-resolution avatar was loaded: '+diag.naturalWidth);
  if(expectedId==='bw26-10' && diag.naturalWidth < 600)
    throw Error(tag+': #20 old low-resolution avatar was loaded: '+diag.naturalWidth);
  if(expectedId==='bw26-08' && (diag.naturalWidth < 320 || diag.objectPosition!=='50% 0%' || diag.transform==='none'))
    throw Error(tag+': #4 must use original Excel portrait and full-hair framing: '+JSON.stringify(diag));
  if(expectedId==='bw26-12' && (diag.naturalWidth < 380 || diag.objectPosition!=='50% 0%' || diag.transform==='none'))
    throw Error(tag+': #28 must use original Excel portrait and full-hair framing: '+JSON.stringify(diag));
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
    '</style></head><body><h1>'+htmlEscape(team.name)+'｜真實路由頭像驗收 '+htmlEscape(view.name)+'</h1>'+
    '<p>左：登錄原圖　中：球隊名單實際 48px　右：個人頁實際頭像（依畫面縮放呈現）。下列全部由實際 React 頁面截取。</p>'+
    '<div class="grid">'+entries.map(e=>'<div class="item"><div class="images">'+
      '<img class="raw" src="data:image/png;base64,'+e.raw+'">'+
      '<img class="roster" src="data:image/png;base64,'+e.roster.png+'">'+
      '<img class="profile" src="data:image/png;base64,'+e.profile.png+'">'+
      '</div><strong>'+htmlEscape(e.name)+'</strong><small>'+htmlEscape(e.id)+'｜'+htmlEscape(e.type)+
      '｜'+Math.round(e.profile.diagnostics.width)+'px 個人頭像</small></div>').join('')+'</div></body></html>';
  const sheet=await browser.newPage({viewport:{width:1220,height:1620},deviceScaleFactor:1});
  await sheet.setContent(html,{waitUntil:'load'});
  await sheet.evaluate(async () => { await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
  await sheet.screenshot({path:path.join(out,short+'-actual-'+view.name+'.jpg'),type:'jpeg',quality:82,fullPage:true});
  await sheet.close();
};
try{
  for(const view of viewports){
    const ctx=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:1,locale:'zh-TW'});
    const page=await ctx.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
    const url=base+'/#/teams/'+encodeURIComponent(team.identityId??team.id)+'?season=2026-27';
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    const rosterSection=page.locator('section').filter({has:page.locator('h2', {hasText:'球員名單'})}).last();
    await rosterSection.waitFor({state:'visible',timeout:20000});
    const rawLinks=await rosterSection.locator('a[aria-label^="查看"]').evaluateAll(els=>els.map(el=>({label:el.getAttribute('aria-label'),href:el.getAttribute('href')})));
    if(rawLinks.length!==players.length)throw Error(view.name+': roster expected '+players.length+' links, got '+rawLinks.length);
    const teamOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    if(teamOverflow)run.failures.push({view:view.name,route:'team',problem:'horizontal overflow'});
    const rosterMap=new Map();
    for(const p of players){
      const link=rosterSection.locator('a[aria-label="查看 '+p.name+' 球員個人資料"]');
      if(await link.count()!==1)throw Error('Team list missing '+p.name);
      const photo=photoForPlayer(p);if(!photo)throw Error('Missing source photo for '+p.name);
      const basename=path.posix.basename(photo).replace(/\.[^.]+$/,'');
      rosterMap.set(p.id,{...await getImage(link.locator('img'),basename,'roster '+p.name),href:await link.getAttribute('href'),photo});
    }
    const staffSection=page.locator('section').filter({has:page.locator('h2',{hasText:'隊職員'})}).last();
    const staffLinks=new Map();
    for(const s of staff){
      const link=staffSection.locator('a[aria-label="查看 '+s.name+' 隊職員個人資料"]');
      if(await link.count()!==1)throw Error('Staff link missing '+s.name);
      const photo=photoForStaff(s);if(!photo)throw Error('Missing staff photo '+s.name);
      const basename=path.posix.basename(photo).replace(/\.[^.]+$/,'');
      staffLinks.set(s.id,{...await getImage(link.locator('img'),basename,'staff '+s.name),href:await link.getAttribute('href'),photo});
    }
    // All lazy roster and staff portraits have now been decoded and element-checked.
    // Capture the full real page from the top; crop the actual roster's page-coordinate box.
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(180);
    const rosterRegion=await rosterSection.evaluate(el=>({top:Math.round(el.getBoundingClientRect().top+window.scrollY),height:Math.round(el.getBoundingClientRect().height)}));
    const fullPage=await page.screenshot({type:'jpeg',quality:77,fullPage:true,animations:'disabled'});
    const metadata=await sharp(fullPage).metadata();
    if(rosterRegion.height<=0||rosterRegion.top<0||rosterRegion.top>=metadata.height)throw Error(view.name+': invalid roster region');
    await sharp(fullPage).extract({left:0,top:rosterRegion.top,width:Math.min(view.width,metadata.width),height:Math.min(rosterRegion.height,metadata.height-rosterRegion.top)})
      .jpeg({quality:82}).toFile(path.join(out,short+'-roster-'+view.name+'.jpg'));
    const entries=[];
    for(const p of players){
      const l=rosterMap.get(p.id);
      await page.goto(new URL(l.href,url).href,{waitUntil:'domcontentloaded',timeout:25000});
      const profileImg=page.locator('img[alt="'+p.name+'"]').first();
      const basename=path.posix.basename(l.photo).replace(/\.[^.]+$/,'');
      const profile=await getImage(profileImg,basename,'profile '+p.name);
      if(!await page.locator('h1').filter({hasText:p.name}).count())throw Error('Wrong profile title '+p.name);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
      if(overflow)run.failures.push({view:view.name,route:'player '+p.id,problem:'horizontal overflow'});
      entries.push({name:p.name,id:p.id,type:'球員',raw:await original(l.photo),roster:l,profile});
      run.viewports.push({view:view.name,route:'player',id:p.id,name:p.name,roster:l.diagnostics,profile:profile.diagnostics,overflow});
    }
    for(const s of staff){
      const l=staffLinks.get(s.id);
      await page.goto(new URL(l.href,url).href,{waitUntil:'domcontentloaded',timeout:25000});
      const img=page.locator('img[alt="'+s.name+' 大頭貼"]').first();
      const basename=path.posix.basename(l.photo).replace(/\.[^.]+$/,'');
      const profile=await getImage(img,basename,'staff page '+s.name);
      entries.push({name:s.name,id:s.id,type:'隊職員',raw:await original(l.photo),roster:l,profile});
      run.viewports.push({view:view.name,route:'staff',id:s.id,name:s.name,roster:l.diagnostics,profile:profile.diagnostics});
    }
    if(errors.length)run.failures.push({view:view.name,route:'browser',problem:errors.slice(0,10)});
    await renderSheet(entries,view);
    await ctx.close();
  }
}finally{await browser.close()}
await fs.writeFile(path.join(out,short+'-actual-route-review.json'),JSON.stringify(run,null,2)+'\n');
console.log(JSON.stringify({routes:run.viewports.length,failures:run.failures,images:[short+'-actual-mobile-390.jpg',short+'-actual-desktop-1280.jpg']},null,2));
if(run.failures.length)process.exitCode=1;
