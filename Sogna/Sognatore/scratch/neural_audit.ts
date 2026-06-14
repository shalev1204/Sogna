import { FS as fs } from '../../Curator/shared/utils/fs.js';
import * as path from 'path';

async function audit() {
  const sources = [
    path.resolve('Memory/intelligence'),
    path.resolve('../toolkit/agents'),
    path.resolve('../toolkit/skills')
  ];

  let totalnodes = 0;
  let fmlinks = 0;
  let bodylinks = 0;
  const allnodes: string[] = [];

  for (const dir of sources) {
    if (!await fs.pathExists(dir)) continue;
    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
    totalnodes += files.length;

    for (const file of files) {
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      const frontmattermatch = content.match(/^---\r?\n([\s\s]+?)\r?\n---/);
      
      const fmcontent = frontmattermatch ? frontmattermatch[1] : '';
      const bodycontent = content.replace(/^---\r?\n[\s\s]+?\r?\n---/, '');

      const fmmatch = fmcontent.match(/\[\[(.*?)\]\]/g);
      const bodymatch = bodycontent.match(/\[\[(.*?)\]\]/g);

      if (fmmatch) fmlinks += fmmatch.length;
      if (bodymatch) bodylinks += bodymatch.length;
      
      allnodes.push(file.replace('.md', ''));
    }
  }

  console.log(`--- neural density audit ---`);
  console.log(`nodos detectados: ${totalnodes}`);
  console.log(`enlaces en frontmatter (actual): ${fmlinks}`);
  console.log(`enlaces en cuerpo (ocultos): ${bodylinks}`);
  console.log(`densidad potencial: ${fmlinks + bodylinks}`);
  console.log(`incremento esperado: ${((bodylinks / fmlinks) * 100).tofixed(2)}%`);
}

audit();
