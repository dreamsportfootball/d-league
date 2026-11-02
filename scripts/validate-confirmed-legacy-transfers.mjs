import { chromium } from 'playwright';

// Owner-confirmed 2025/26 team history; no transfer dates are inferred.
const base=(process.env.AUDIT_BASE_URL??'http://127.0.0.1:4173/d-league').replace(/\/$/,'');
const cases=[
 {name:'戴威閎',id:'ns-11',teams:['t_crazydog','t_niaoshi'],goals:3,current:'t_pingtung'},
 {name:'楊承諺',id:'cd-06',teams:['wanderers','t_crazydog'],goals:1,current:'t_kaohsiung_amateur_2026'},
 {name:'趙學邦',id:'kuromi-chao-hsueh-pang',teams:['t_crazydog','t_tongque'],goals:3,current:'t_kuromi_2026'},
 {name:'蔡軒誠',id:'ns-51',teams:['t_niaoshi'],goals:1,period:'上半季'},
];
const browser=await chromium.launch({headless:true});
const errors=[];
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Taipei',locale:'zh-TW',serviceWorkers:'block'});
  try{
   const page=await context.newPage();
   for(const player of cases){
    try{
     await page.goto(`${base}/#/players/${player.id}?season=2025-26`,{waitUntil:'domcontentloaded',timeout:30000});
     await page.getByRole('heading',{name:player.name,exact:true}).first().waitFor({state:'visible',timeout:20000});
     const section=page.locator('section').filter({has:page.getByRole('heading',{name:'D LEAGUE 生涯',exact:true})});
     await section.waitFor({state:'visible'});
     const links=await section.locator('a[href*="/teams/"][href*="season=2025-26"]').evaluateAll(els=>els.map(el=>el.getAttribute('href')??''));
     for(const team of player.teams){
      if(!links.some(href=>href.includes(`/teams/${team}?season=2025-26`)))
        throw new Error(`missing team ${team}, actual=${JSON.stringify(links)}`);
     }
     if(new Set(links).size!==player.teams.length)
      throw new Error(`unexpected team links ${JSON.stringify(links)}`);
     if(player.period) {
      const note=section.locator('span:visible').filter({hasText:/^上半季$/});
      if(await note.count()!==1) throw new Error('missing first-half participation label');
     }
     const stat=page.locator('dt').filter({hasText:/^進球$/}).first().locator('xpath=following-sibling::dd').first();
     const score=Number((await stat.innerText()).trim());
     if(score!==player.goals)throw new Error(`personal goals ${score} instead of ${player.goals}`);
     if(player.current){
      await page.goto(`${base}/#/players/${player.id}?season=2026-27`,{waitUntil:'domcontentloaded'});
      await page.getByRole('heading',{name:player.name,exact:true}).first().waitFor({state:'visible',timeout:20000});
     }
     console.log(`[confirmed-transfers] ${width}px ${player.name} teams and goals passed`);
    }catch(error){errors.push(`${width}px ${player.name}: ${error.message}`);}
   }
  }finally{await context.close();}
 }
}finally{await browser.close();}
if(errors.length){errors.forEach(e=>console.error('[confirmed-transfers] '+e));process.exitCode=1;}
else console.log('[confirmed-transfers] 2025/26 four confirmations passed on mobile/desktop');
