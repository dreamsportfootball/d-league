/**
 * D LEAGUE 2026/27: Pingtung Wolves source-preserving per-person photo framing.
 * Same verified original photographs as 屏東野狼.xlsx, no AI generation,
 * no edits to individual identity, player metadata, other teams or seasons.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const root=process.cwd();
const folder=path.join(root,'public/assets/seasons/2026-27/players');
const mappingPath=path.join(root,'data/seasons/2026-27/playerImages.json');
const auditPath=path.join(root,'audit/pingtung-wolves-source-framing-20261105.json');
const px=512;
const variants=[
  {id:'04',number:56,name:'黃翊軒',mode:'crop',rect:{left:0,top:20,width:337,height:337},size:[337,449]},
  {id:'11',number:28,name:'林瑶璇',mode:'crop',rect:{left:40,top:68,width:176,height:176},size:[252,448]},
  {id:'13',number:33,name:'黃旭盛',mode:'crop',rect:{left:0,top:0,width:661,height:661},size:[661,827]},
  {id:'15',number:37,name:'張承堯',mode:'crop',rect:{left:0,top:82,width:252,height:252},size:[252,448]},
  {id:'14',number:97,name:'吳宇唐',mode:'inset',size:[327,460]},
];
const map=JSON.parse(await fs.readFile(mappingPath,'utf8'));
const results=[];
for(const p of variants){
  const old='assets/seasons/2026-27/players/pw26-'+p.id+'.png';
  const name='pw26-'+p.id+'-owner-'+p.mode+'-20261105.webp';
  const next='assets/seasons/2026-27/players/'+name;
  if(map[p.name]!==old && map[p.name]!==next)
    throw Error('Unexpected mapping for '+p.name+': '+map[p.name]);
  const bytes=await fs.readFile(path.join(folder,'pw26-'+p.id+'.png'));
  const meta=await sharp(bytes).metadata();
  if(meta.width!==p.size[0] || meta.height!==p.size[1])
    throw Error('Unexpected original size for '+p.name+': '+meta.width+'x'+meta.height);
  let image;
  if(p.mode==='crop'){
    image=await sharp(bytes).extract(p.rect).resize(px,px)
      .webp({quality:93,effort:5}).toBuffer();
  }else{
    // Original #97 hair is already touching the source image boundary.
    // Inset the *existing* pixels; never generate missing hair/face details.
    const source=await sharp(bytes).resize(390,435,{fit:'inside'})
      .removeAlpha().raw().toBuffer({resolveWithObject:true});
    const w=source.info.width, h=source.info.height;
    if(source.info.channels!==3) throw Error('Expected RGB source');
    const rgb=[217,217,189]; // sampled neutral beige in original background
    const x0=Math.floor((px-w)/2), y0=Math.floor((px-h)/2);
    const out=Buffer.alloc(px*px*3);
    for(let y=0;y<px;y++)for(let x=0;x<px;x++){
      const sx=x-x0,sy=y-y0,d=(y*px+x)*3;
      if(sx<0||sy<0||sx>=w||sy>=h){
        for(let ch=0;ch<3;ch++)out[d+ch]=rgb[ch];
      }else{
        const edge=Math.min(sx+1,sy+1,w-sx,h-sy);
        const a=Math.min(1,edge/18),src=(sy*w+sx)*3;
        for(let ch=0;ch<3;ch++)out[d+ch]=Math.round(source.data[src+ch]*a+rgb[ch]*(1-a));
      }
    }
    image=await sharp(out,{raw:{width:px,height:px,channels:3}})
      .webp({quality:93,effort:5}).toBuffer();
  }
  await fs.writeFile(path.join(folder,name),image);
  map[p.name]=next;
  results.push({number:p.number,name:p.name,old,new:next,mode:p.mode,
    rect:p.rect??null,sourceSize:p.size,sourceSha256:createHash('sha256').update(bytes).digest('hex')});
}
await fs.writeFile(mappingPath,JSON.stringify(map,null,2)+'\n');
await fs.writeFile(auditPath,JSON.stringify({team:'t_pingtung_wolves_2026',
  season:'2026-27',source:'Latest Excel verified same-person PNG source',
  changed:results,unchangedPlayers:10,unchangedStaff:3},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
