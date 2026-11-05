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
  // Three previously rejected portraits: preserve hair, chin and exact identity.
  // The original image is tall; object-position alone used to cut the chin.
  {id:'06',name:'黃柏文',number:3,mode:'full-head',scale:1.25,offsetY:6,bg:'#f2f0e8'},
  {id:'08',name:'謝承晉',number:79,mode:'full-head',scale:1.30,offsetY:0,bg:'#b1b1b1'},
  {id:'15',name:'范丞佑',number:53,mode:'full-head',scale:1.27,offsetY:8,bg:'#d8c9ba',crop:{left:0,top:0,width:313,height:380}},
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
/**
 * Square-fit a tall, already verified original. Use the photograph's own pixels
 * in the centre and softly blend only the image's outer border into a matching
 * neutral backdrop; do not alter, invent or regenerate facial details.
 */
async function fullHeadPortrait(photo,region,cfg){
  const img=region?sharp(photo).extract(region):sharp(photo);
  const meta=await img.metadata();
  if(!meta.width||!meta.height)throw Error('Unknown source dimensions '+cfg.name);
  const w=Math.round(meta.width*cfg.scale),h=Math.round(meta.height*cfg.scale);
  const r=await img.resize({width:w,height:h,fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  if(r.info.channels!==3)throw Error('Expected RGB source '+cfg.name);
  const rgb=[1,3,5].map(i=>parseInt(cfg.bg.slice(i,i+2),16));
  if(rgb.some(n=>!Number.isInteger(n)))throw Error('Invalid backdrop '+cfg.name);
  const canvas=Buffer.alloc(width*width*3);
  const left=Math.floor((width-w)/2),top=cfg.offsetY;
  for(let y=0;y<width;y++)for(let x=0;x<width;x++){
    const sx=x-left,sy=y-top,dst=(y*width+x)*3;
    if(sx<0||sy<0||sx>=w||sy>=h){
      canvas[dst]=rgb[0];canvas[dst+1]=rgb[1];canvas[dst+2]=rgb[2];
      continue;
    }
    const edge=Math.min(sx,sy,w-1-sx,h-1-sy);
    const alpha=Math.max(0,Math.min(1,(edge+1)/24));
    const src=(sy*w+sx)*3;
    for(let c=0;c<3;c++)canvas[dst+c]=Math.round(r.data[src+c]*alpha+rgb[c]*(1-alpha));
  }
  return sharp(canvas,{raw:{width,height:width,channels:3}}).webp({quality:92,effort:5}).toBuffer();
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
    :cfg.mode==='full-head'
      ?await fullHeadPortrait(input,region,cfg)
      :await letterbox(input,region,cfg.ratio);
  await fs.writeFile(path.join(playerFolder,name),output);
  mapping[cfg.name]=next;
  changes.push({number:cfg.number,name:cfg.name,source:old,output:next,sourcePixels:[meta.width,meta.height],mode:cfg.mode,crop:region,sourceSha256:createHash('sha256').update(input).digest('hex')});
}
await fs.writeFile(mappingFile,JSON.stringify(mapping,null,2)+'\n');
await fs.mkdir(path.dirname(reportFile),{recursive:true});
await fs.writeFile(reportFile,JSON.stringify({season:'2026-27',team:'t_holy_knights_2026',source:'latest 聖騎士.xlsx verified against canonical PNG',changes},null,2)+'\n');
console.log('Created '+changes.length+' portraits for Holy Knights');