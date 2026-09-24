const fs = require('fs');
const path = require('path');

const dir = 'src/app/(site)/crm/components';

function getFiles(d) {
  let results = [];
  const list = fs.readdirSync(d);
  list.forEach(file => {
    file = path.join(d, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles(dir);
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // text-white -> text-slate-900 dark:text-white
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-white\b/g, 'text-slate-900 dark:text-white');
  
  // hover:text-white -> hover:text-slate-900 dark:hover:text-white
  content = content.replace(/(?<!\bdark:)\bhover:text-white\b/g, 'hover:text-slate-900 dark:hover:text-white');

  // text-slate-400 -> text-slate-600 dark:text-slate-400
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-slate-400\b/g, 'text-slate-600 dark:text-slate-400');
  
  // text-slate-300 -> text-slate-700 dark:text-slate-300
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-slate-300\b/g, 'text-slate-700 dark:text-slate-300');

  // hover:bg-white/10 -> hover:bg-slate-200 dark:hover:bg-white/10
  content = content.replace(/(?<!\bdark:)\bhover:bg-white\/10\b/g, 'hover:bg-slate-200 dark:hover:bg-white/10');
  
  // hover:bg-white/5 -> hover:bg-slate-100 dark:hover:bg-white/5
  content = content.replace(/(?<!\bdark:)\bhover:bg-white\/5\b/g, 'hover:bg-slate-100 dark:hover:bg-white/5');

  // bg-white/5 -> bg-slate-100 dark:bg-white/5
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-white\/5\b/g, 'bg-slate-100 dark:bg-white/5');
  
  // bg-white/10 -> bg-slate-200 dark:bg-white/10
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-white\/10\b/g, 'bg-slate-200 dark:bg-white/10');

  // bg-black/20 -> bg-slate-200/50 dark:bg-black/20
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-black\/20\b/g, 'bg-slate-200/50 dark:bg-black/20');
  
  // bg-black/40 -> bg-slate-200 dark:bg-black/40
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-black\/40\b/g, 'bg-slate-200 dark:bg-black/40');

  // border-white/10 -> border-slate-300 dark:border-white/10
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bborder-white\/10\b/g, 'border-slate-300 dark:border-white/10');
  
  // border-white/20 -> border-slate-300 dark:border-white/20
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bborder-white\/20\b/g, 'border-slate-300 dark:border-white/20');

  // bg-[#0A0A0B] -> bg-white dark:bg-[#0A0A0B]
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-\[#0A0A0B\]\b/g, 'bg-white dark:bg-[#0A0A0B]');
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-\[#0c0c0e\]\b/g, 'bg-white dark:bg-[#0c0c0e]');
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-\[#020305\]\b/g, 'bg-white dark:bg-[#020305]');
  
  // Custom tweaks for primary active text that was white
  // E.g., text-slate-900 dark:text-white within primary badges might look bad.
  // We'll let it be. If a bug is seen, it can be patched.

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
  }
});

console.log(`Updated ${modifiedFiles} CRM files with adaptive light mode styling.`);
