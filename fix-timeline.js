const fs = require('fs');

const file = 'src/components/itinerary-timeline.tsx';
let content = fs.readFileSync(file, 'utf8');
let original = content;

// backgrounds
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-slate-50/50 dark:bg-white/[0.02]');
content = content.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:bg-slate-100 dark:hover:bg-white/[0.04]');
content = content.replace(/bg-white\/5/g, 'bg-slate-100/50 dark:bg-white/5');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-200 dark:hover:bg-white/10');
content = content.replace(/hover:bg-white\/15/g, 'hover:bg-slate-300 dark:hover:bg-white/15');

// text colors
content = content.replace(/\btext-zinc-300\b/g, 'text-slate-900 dark:text-zinc-300');
content = content.replace(/\btext-zinc-200\b/g, 'text-slate-800 dark:text-zinc-200');
content = content.replace(/\btext-white\/90\b/g, 'text-slate-800 dark:text-white/90');
content = content.replace(/\btext-white\/80\b/g, 'text-slate-700 dark:text-white/80');

// specifically for pure text-white, avoid double replaces if somehow it runs twice
// regex: replace text-white that is NOT preceded by dark:
content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-white\b/g, 'text-slate-900 dark:text-white');
content = content.replace(/(?<!\bdark:)\bhover:text-white\b/g, 'hover:text-slate-900 dark:hover:text-white');

// borders
content = content.replace(/border-white\/10/g, 'border-slate-300/60 dark:border-white/10');
content = content.replace(/border-white\/5/g, 'border-slate-300/60 dark:border-white/5');

// specifically for the background of the dialog or timeline cards if they have bg-[#0a0a0b]/95
content = content.replace(/bg-\[#0a0a0b\]\/95/g, 'bg-white/95 dark:bg-[#0a0a0b]/95');

if (content !== original) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated itinerary-timeline.tsx successfully.');
} else {
  console.log('No changes were made.');
}
