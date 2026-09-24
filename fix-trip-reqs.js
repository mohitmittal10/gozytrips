const fs = require('fs');

const file = 'src/components/the-lab/TheLabSummaryPanel.tsx';
let content = fs.readFileSync(file, 'utf8');
let original = content;

// Input fields and textareas
content = content.replace(/text-white placeholder:text-zinc-600/g, 'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600');
content = content.replace(/bg-white\/5 border border-white\/10/g, 'bg-slate-50 dark:bg-white/5 border border-slate-300/60 dark:border-white/10');
content = content.replace(/text-zinc-200 placeholder:text-zinc-600/g, 'text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600');

// AI Box input
content = content.replace(/text-white placeholder:text-purple-300\/40/g, 'text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-purple-300/40');
content = content.replace(/text-white placeholder:text-zinc-500/g, 'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500');
content = content.replace(/bg-black\/40/g, 'bg-white/80 dark:bg-black/40');

// View mode texts
content = content.replace(/text-zinc-200 font-semibold/g, 'text-slate-900 dark:text-zinc-200 font-semibold');
content = content.replace(/text-zinc-300 leading-normal/g, 'text-slate-800 dark:text-zinc-300 leading-normal');
content = content.replace(/text-zinc-300 text-\[10px\]/g, 'text-slate-800 dark:text-zinc-300 text-[10px]');
content = content.replace(/text-white font-bold/g, 'text-slate-900 dark:text-white font-bold');

// Travel Methods span
content = content.replace(/text-zinc-300">/g, 'text-slate-800 dark:text-zinc-300">');
content = content.replace(/text-zinc-300"\n/g, 'text-slate-800 dark:text-zinc-300"\n');
content = content.replace(/text-zinc-300"\r/g, 'text-slate-800 dark:text-zinc-300"\r');

// Buttons / pills
content = content.replace(/hover:text-white hover:bg-white\/10/g, 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-100 dark:hover:bg-white/5');
content = content.replace(/bg-white\/5/g, 'bg-slate-100/50 dark:bg-white/5');
content = content.replace(/border-white\/10/g, 'border-slate-300/60 dark:border-white/10');
content = content.replace(/border-white\/5/g, 'border-slate-300/60 dark:border-white/5');

// Additional adjustments for buttons that should remain white
content = content.replace(/text-slate-900 dark:text-white font-bold/g, 'text-slate-900 dark:text-white font-bold');

if (content !== original) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated TheLabSummaryPanel.tsx successfully.');
} else {
  console.log('No changes were made.');
}
