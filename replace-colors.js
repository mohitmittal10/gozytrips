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

  // Replace text-gray-400 that are NOT preceded by dark:, hover:, focus:, etc (or just not dark:)
  // Better regex: (?<!dark:|hover:|focus:|active:)text-gray-400
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)(?<!\bfocus:)\btext-gray-400\b/g, 'text-slate-500 dark:text-gray-400');
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)(?<!\bfocus:)\btext-zinc-400\b/g, 'text-slate-500 dark:text-zinc-400');
  content = content.replace(/(?<!\bdark:)(?<!\bhover:)(?<!\bfocus:)\btext-slate-400\b/g, 'text-slate-500 dark:text-slate-400');

  // Also catch text-foreground/40 just in case? No, the user specified a hex that maps exactly to gray-400.

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
