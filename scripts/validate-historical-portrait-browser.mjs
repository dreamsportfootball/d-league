import { chromium } from 'playwright';

// Use the same built site and source modules as the other website regression checks.
const base=(process.env.AUDIT_BASE_URL??'http://127.0.0.1:4173/d-league').replace(/\/$/,'');
const source=(process.env.AUDIT_SOURCE_URL??'http://127.0.0.1:4174/d-league').replace(/\/$/,'');
const cases=[
  {team:'chiayi-235-fc',season:'2025-26',player:'鄭州偉',id:'cy-12',file:'assets/seasons/2026-27/players/c23526-09.png'},
  {team:'chiayi-235-fc',season:'2025-26',player:'溫立丞',id:'cy-32',file:'assets/seasons/2026-27/players/c23526-17.png'},
  {team:'t_tongque',season:'2025-26',player:'巫嘉德',id:'tq-16',file:'assets/seasons/2026-27/players/ku26-13.png'},
  {team:'tainan-niaoshi-fc',season:'2025-26',player:'戴威閎',id:'ns-11',file:'assets/seasons/2026-27/players/pwa26-06.png'},
  {team:'t_pingtung',season:'2025-26',player:'邱文良',id:'pt-38',file:'assets/seasons/2026-27/players/pwa26-01.webp'}, // Returning player: display latest portrait while keeping the 2025/26 roster
  {team:'kuromi',season:'2025-26',player:'陳建宏',id:'cd-20',file:'assets/players/瘋Dog/陳建宏.png'},
];
const browser=await chromium.launch({headless:true});
const errors=[];
const checkImage=async(image,expected,where)=>{
  await image.waitFor({state:'visible',timeout:25000});
  await image.scrollIntoViewIfNeeded();
  const src=(await image.getAttribute('src'))??'';
  const actual=decodeURIComponent(src).replace(/\.(png|jpe?g|webp)(?:\?.*)?$/i,'');
  const target=expected.replace(/\.(png|jpe?g|webp)$/i,'');
  if(!actual.includes(target))throw new Error(`${where}: expected ${target}, got ${actual}`);
  const loaded=await image.evaluate(async img=>{
    try{await img.decode();return img.naturalWidth>0;}catch{return false;}
  });
  if(!loaded)throw new Error(`${where}: image decode failed: ${src}`);
};
try {
  const context=await browser.newContext({
    viewport:{width:1280,height:900},locale:'zh-TW',timezoneId:'Asia/Taipei',
    serviceWorkers:'block',
  });
  const page=await context.newPage();
  await page.goto(source+'/#/',{waitUntil:'domcontentloaded',timeout:30000});
  const runtime=await page.evaluate(async()=>{
    const {getSeasonData,getLatestPlayerImageUrl}=await import('/d-league/services/seasonDataJson.ts');
    const recent=getSeasonData('2026-27');
    const older=getSeasonData('2025-26');
    const newByIdentity=new Map(recent.players.map(p=>[p.identityId??p.id,p]));
    const rows=[...recent.players,...older.players];
    const failures=[];
    let newerPortraits=0,earlierFallbacks=0;
    for(const person of rows){
      const identity=person.identityId??person.id;
      const latest=newByIdentity.get(identity);
      const expected=latest
        ? recent.playerImages[latest.name]??older.playerImages[person.name]
        : older.playerImages[person.name];
      const actual=getLatestPlayerImageUrl(person);
      if(expected&&actual!==expected)failures.push({person:person.name,identity,expected,actual});
      if(latest&&older.players.includes(person)){
        if(recent.playerImages[latest.name])newerPortraits++;
        else earlierFallbacks++;
      }
    }
    return {count:rows.length,newerPortraits,earlierFallbacks,failures};
  });
  if(runtime.count!==507||runtime.failures.length)errors.push('All-player image runtime: '+JSON.stringify(runtime));
  console.log('[historical-portraits] all-player source audit '+JSON.stringify(runtime));

  for(const width of [390,1280]){
    await page.setViewportSize({width,height:900});
    for(const item of cases){
      try{
        await page.goto(`${base}/#/teams/${item.team}?season=${item.season}`,{waitUntil:'domcontentloaded',timeout:30000});
        const roster=page.locator('section').filter({has:page.getByRole('heading',{name:'球員名單',exact:true})});
        const link=roster.getByRole('link',{name:`查看 ${item.player} 球員個人資料`});
        await link.first().waitFor({state:'visible',timeout:20000});
        if(await link.count()!==1)throw Error('roster link missing or duplicated');
        await checkImage(link.locator('img'),item.file,'roster '+item.player);
        await page.goto(`${base}/#/players/${item.id}?season=2025-26`,{waitUntil:'domcontentloaded',timeout:30000});
        await checkImage(page.locator('main img.object-cover').first(),item.file,'profile '+item.player);
        console.log(`[historical-portraits] ${width}px ${item.player} correct`);
      }catch(e){errors.push(`${width}px ${item.player}: ${e.message}`);}
    }
    await page.goto(base+'/#/teams/tainan-niaoshi-fc?season=2025-26',{waitUntil:'domcontentloaded'});
    const roster=page.locator('section').filter({has:page.getByRole('heading',{name:'球員名單',exact:true})});
    if(await roster.getByRole('link',{name:'查看 蔡軒誠 球員個人資料'}).count())errors.push(`${width}px: Tsai should be hidden from old team roster`);
    await page.goto(base+'/#/players/ns-51?season=2025-26',{waitUntil:'domcontentloaded'});
    await checkImage(page.locator('img[alt="蔡軒誠"]').first(),'assets/players/鳥仕足球俱樂部/蔡軒誠.png','historical-only Tsai');
  }
  await context.close();
}finally{await browser.close();}
if(errors.length){errors.forEach(error=>console.error('[historical-portraits] '+error));process.exitCode=1;}
else console.log('[historical-portraits] all cross-season identity and visible portrait checks passed');
