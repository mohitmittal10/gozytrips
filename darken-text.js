const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace text-slate-500 with text-slate-600 for the specific pairs we just made
  content = content.replace(/text-slate-500 dark:text-gray-400/g, 'text-slate-600 dark:text-gray-400');
  content = content.replace(/text-slate-500 dark:text-zinc-400/g, 'text-slate-600 dark:text-zinc-400');
  content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-slate-600 dark:text-slate-400');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
