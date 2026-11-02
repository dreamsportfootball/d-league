import { chromium } from 'playwright';

// Owner-confirmed 2025/26 team history; no transfer dates are inferred.
const base=(process.env.AUDIT_BASE_URL??'http://127.0.0.1:4173/d-league').replace(/\/$/,'');
const cases=[
 {name:'戴威閎',id:'ns-11',teams:['kuromi','tainan-niaoshi-fc'],goals:3,current:'t_pingtung'},
 {name:'楊承諺',id:'cd-06',teams:['wanderers','kuromi'],goals:1,current:'t_kaohsiung_amateur_2026'},
 {name:'趙學邦',id:'kuromi-chao-hsueh-pang',teams:['kuromi','t_tongque'],goals:3,current:'t_kuromi_2026'},
 {name:'蔡軒誠',id:'ns-51',teams:['tainan-niaoshi-fc'],goals:1},
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
     // Both responsive career tables are present in the DOM; count each
     // canonical team link once rather than treating hidden duplicates as extra teams.
     if(player.id==='ns-51' && (await section.innerText()).includes('上半季')) {
      throw new Error('half-season label must not be displayed');
     }
     if (player.id === 'ns-51') {
      // The former first-half player remains in the historical database and
      // retains his goal, but the owner explicitly excludes him from the
      // published 2025/26 team roster.
      await page.goto(`${base}/#/teams/tainan-niaoshi-fc?season=2025-26`, {
        waitUntil: 'domcontentloaded', timeout: 30000,
      });
      const roster=page.locator('section').filter({
        has:page.getByRole('heading',{name:'球員名單',exact:true}),
      });
      await roster.waitFor({state:'visible',timeout:20000});
      if(await roster.getByRole('link',{name:'查看 蔡軒誠 球員個人資料'}).count())
        throw new Error('first-half-only Tsai must not appear on Niaoshi roster');
      if(await roster.getByRole('link',{name:'查看 戴威閎 球員個人資料'}).count()!==1)
        throw new Error('unrelated roster entries must remain intact');
      await page.goto(`${base}/#/players/ns-51?season=2025-26`,{
        waitUntil:'domcontentloaded',timeout:30000,
      });
      await page.getByRole('heading',{name:'蔡軒誠',exact:true}).first().waitFor({state:'visible',timeout:20000});
     }
     // The header can represent the latest 2026/27 profile for returning
     // players. Assert the actual 2025/26 career rows, not the latest header.
     const visibleRows = width < 768
      ? section.locator('[role="table"]:visible [role="rowgroup"] [role="row"]')
      : section.locator('table:visible tbody tr');
     const oldRows = await visibleRows.evaluateAll(els => els.map(el => {
       const cells = [...el.querySelectorAll('[role="cell"], td')];
       return {
         season:cells[0]?.textContent?.trim()??'',
         goals:Number(cells[3]?.textContent?.trim()??'NaN'),
       };
     }).filter(item=>item.season.includes('2025/26')));
     const score=oldRows.reduce((total,row)=>total+row.goals,0);
     if(!oldRows.length||score!==player.goals)
      throw new Error(`2025/26 career goals ${score} instead of ${player.goals}, rows=${JSON.stringify(oldRows)}`);
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
