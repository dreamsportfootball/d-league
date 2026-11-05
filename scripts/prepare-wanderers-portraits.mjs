// WANDERERS 2026/27 portrait source-preserving reframe.
// Only the same-person canonical PNG files are used; no AI-generated facial details.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const folder = path.join(root, 'public/assets/seasons/2026-27/players');
const mapPath = path.join(root, 'data/seasons/2026-27/playerImages.json');
const cssPath = path.join(root, 'config/avatarImagePosition.ts');
const suffix = '-owner-fit-20261105.webp';
const width = 512;

// Tuning is per person, against actual 48/104/160px crops and KUROMI #16.
// Never generate facial pixels; only preserve/inset the original photograph.
const portraits = [
  {id:'01',name:'林湧鈞',scale:.96},
  {id:'04',name:'蔡羿丞',scale:.96},
  {id:'05',name:'洪萁宏',scale:.94},
  {id:'07',name:'陳韋廷',scale:.94},
  {id:'10',name:'毛邦丞',scale:.94},
  {id:'11',name:'王亮鈞',scale:.94},
  {id:'14',name:'洪子程',scale:.94},
  {id:'15',name:'張賢國',scale:.94},
  // Original paper border is excluded without altering the person.
  {id:'16',name:'尤昱翔',scale:.98,crop:{left:48,top:50,width:325,height:420}},
];
const images=JSON.parse(await fs.readFile(mapPath,'utf8'));
let positions=await fs.readFile(cssPath,'utf8');
const changed=[];
for(const p of portraits){
  const srcRel='assets/seasons/2026-27/players/wa26-'+p.id+'.png';
  const dstRel='assets/seasons/2026-27/players/wa26-'+p.id+suffix;
  if(images[p.name]!==srcRel && images[p.name]!==dstRel) throw Error('WANDERERS photo mapping mismatch '+p.name+': '+images[p.name]);
  const input=path.join(folder,'wa26-'+p.id+'.png');
  const img=sharp(input).rotate();
  const meta=await img.metadata();
  if(meta.width<120||meta.height<150) throw Error('Unexpected too-small original '+p.name);
  const source=p.crop?img.extract(p.crop):img;
  // Extend only the photograph's boundary pixels to a square.
  // This avoids unnatural rectangular white/gray seams in the 48/104/160px circle.
  const overlay=await source
    .resize(Math.round(width*p.scale),Math.round(width*p.scale),{fit:'inside',withoutEnlargement:false})
    .removeAlpha().raw().toBuffer({resolveWithObject:true});
  const md=overlay.info;
  if(md.channels!==3) throw Error('Expected RGB source '+p.name);
  const x0=Math.floor((width-md.width)/2), y0=Math.floor((width-md.height)/2);
  const square=Buffer.alloc(width*width*3);
  for(let y=0;y<width;y++){
    const sy=Math.max(0,Math.min(md.height-1,y-y0));
    for(let x=0;x<width;x++){
      const sx=Math.max(0,Math.min(md.width-1,x-x0));
      const srcOffset=(sy*md.width+sx)*3, dstOffset=(y*width+x)*3;
      square[dstOffset]=overlay.data[srcOffset];
      square[dstOffset+1]=overlay.data[srcOffset+1];
      square[dstOffset+2]=overlay.data[srcOffset+2];
    }
  }
  const dst=path.join(folder,'wa26-'+p.id+suffix);
  await sharp(square,{raw:{width,height:width,channels:3}})
    .webp({quality:92,effort:5}).toFile(dst);
  images[p.name]=dstRel;
  const regex=new RegExp("^  '/assets/seasons/2026-27/players/wa26-"+p.id+"\\.': .*\\n",'gm');
  positions=positions.replace(regex,'');
  changed.push({person:p.name,id:p.id,src:srcRel,dst:dstRel,sourceSize:[meta.width,meta.height],scale:p.scale});
}
// Fix a dark source by increasing light level only, without retouching identity.
{
  const p={id:'09',name:'沈家弘'};
  const src='assets/seasons/2026-27/players/wa26-09.png';
  if(images[p.name]!==src && images[p.name]!==dst) throw Error('Image mapping changed for '+p.name);
  const dst='assets/seasons/2026-27/players/wa26-09-owner-light-20261105.webp';
  await sharp(path.join(folder,'wa26-09.png'))
    .modulate({brightness:1.18,saturation:1.03})
    .webp({quality:94,effort:5}).toFile(path.join(folder,'wa26-09-owner-light-20261105.webp'));
  images[p.name]=dst;
  changed.push({person:p.name,id:p.id,src,dst,lighting:'brightness 1.18; no face retouch'});
}
await fs.writeFile(mapPath,JSON.stringify(images,null,2)+'\n');
await fs.writeFile(cssPath,positions);
const result={season:'2026-27',teamId:'t_wanderers_2026',source:'Wanderers.xlsx / canonical same-person GitHub original PNG',changed};
await fs.writeFile(path.join(root,'audit/wanderers-owner-fit-generated.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
