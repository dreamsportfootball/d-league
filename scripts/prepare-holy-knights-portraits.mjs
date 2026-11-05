/**
 * D LEAGUE 2026/27 | 聖騎士足球俱樂部
 * Only crop or letterbox verified same-person Excel-equivalent PNG sources.
 * No AI generation, face restoration, skin smoothing or identity substitution.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root=process.cwd();
const playerFolder=path.join(root,'public/assets/seasons/2026-27/players');
const mappingFile=path.join(root,'data/seasons/2026-27/playerImages.json');
const reportFile=path.join(root,'audit/holy-knights-source-framing-generated.json');
const width=512;
const configs=[
  {id:'04',name:'戴吉甫',number:21,mode:'soft-inset',ratio:.84},
  {id:'07',name:'陳竑沅',number:1,mode:'face-crop',crop:{left:75,top:90,width:170,height:170}},
  {id:'10',name:'黃品喬',number:95,mode:'face-crop',crop:{left:54,top:32,width:205,height:205}},
  {id:'11',name:'黃祥恩',number:26,mode:'face-crop',crop:{left:44,top:62,width:225,height:225}},
  {id:'14',name:'蘇憲奕',number:2,mode:'soft-inset',ratio:.88},
  {id:'16',name:'蘇子恆',number:16,mode:'soft-inset',ratio:.95,cropFraction:{top:.09,bottom:.89}},
];
const mapping=JSON.parse(await fs.readFile(mappingFile,'utf8'));
const changes=[];
const asRegion=(meta,cfg)=>{
  if(cfg.crop){
    const {left,top,width:w,height:h}=cfg.crop;
    if(left<0||top<0||left+w>meta.width||top+h>meta.height)throw Error('Crop outside original '+cfg.name);
    return cfg.crop;
  }
  if(cfg.cropFraction){
    const top=Math.floor(meta.height*cfg.cropFraction.top);
    const bottom=Math.ceil(meta.height*cfg.cropFraction.bottom);
    return {left:0,top,width:meta.width,height:bottom-top};
  }
  return null;
};
async function letterbox(photo,region,ratio){
  const cropped=region?sharp(photo).extract(region):sharp(photo);
  const source=await cropped.png().toBuffer();
  // Blurred background is derived only from the same source photograph.
  const background=await sharp(source).resize(width,width,{fit:'cover',position:'centre'}).blur(28).png().toBuffer();
  const fg=await sharp(source)
    .resize(Math.round(width*ratio),Math.round(width*ratio),{fit:'inside'})
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:fw,height:fh,channels}=fg.info;
  if(channels!==4)throw Error('Expected RGBA foreground');
  const feather=26;
  const data=Buffer.from(fg.data);
  for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){
    const edge=Math.min(x,y,fw-1-x,fh-1-y);
    data[(y*fw+x)*4+3]=Math.max(0,Math.min(255,Math.round((edge+1)*255/feather)));
  }
  const foreground=await sharp(data,{raw:{width:fw,height:fh,channels:4}}).png().toBuffer();
  return sharp(background).composite([{input:foreground,left:Math.floor((width-fw)/2),top:Math.floor((width-fh)/2)}])
    .webp({quality:92,effort:5}).toBuffer();
}
for(const cfg of configs){
  const old='assets/seasons/2026-27/players/holy26-'+cfg.id+'.png';
  const name='holy26-'+cfg.id+'-owner-'+cfg.mode+'-20261105.webp';
  const next='assets/seasons/2026-27/players/'+name;
  if(mapping[cfg.name]!==old&&mapping[cfg.name]!==next)
    throw Error('Unexpected image mapping for '+cfg.name+': '+mapping[cfg.name]);
  const input=await fs.readFile(path.join(playerFolder,'holy26-'+cfg.id+'.png'));
  const meta=await sharp(input).metadata();
  if(!meta.width||!meta.height)throw Error('Invalid source '+cfg.name);
  const region=asRegion(meta,cfg);
  const output=cfg.mode==='face-crop'
    ?await sharp(input).extract(region).resize(width,width,{fit:'fill'}).webp({quality:92,effort:5}).toBuffer()
    :await letterbox(input,region,cfg.ratio);
  await fs.writeFile(path.join(playerFolder,name),output);
  mapping[cfg.name]=next;
  changes.push({number:cfg.number,name:cfg.name,source:old,output:next,sourcePixels:[meta.width,meta.height],mode:cfg.mode,crop:region,sourceSha256:createHash('sha256').update(input).digest('hex')});
}
await fs.writeFile(mappingFile,JSON.stringify(mapping,null,2)+'\n');
await fs.mkdir(path.dirname(reportFile),{recursive:true});
await fs.writeFile(reportFile,JSON.stringify({season:'2026-27',team:'t_holy_knights_2026',source:'latest 聖騎士.xlsx verified against canonical PNG',changes},null,2)+'\n');
console.log('Created '+changes.length+' portraits for Holy Knights');