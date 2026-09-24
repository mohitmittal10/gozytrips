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

const patterns = {
  'bg-black/': 0,
  'bg-white/': 0,
  'text-white': 0,
  'hover:text-white': 0,
  'hover:bg-white/': 0,
  'border-white/': 0,
  'text-slate-300': 0,
  'text-slate-400': 0,
  'bg-[#': 0, // Hardcoded hex backgrounds
};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  for (const [pattern, count] of Object.entries(patterns)) {
    // Basic counting, ignoring if it already has dark: (imperfect but gives a rough idea)
    const matches = content.match(new RegExp(`(?<!dark:)${pattern.replace(/\[/g, '\\[').replace(/\//g, '\\/')}`, 'g'));
    if (matches) {
      patterns[pattern] += matches.length;
    }
  }
});

console.log("Analysis of hardcoded colors without dark: prefix in CRM:");
console.log(JSON.stringify(patterns, null, 2));
