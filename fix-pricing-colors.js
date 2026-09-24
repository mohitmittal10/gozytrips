const fs = require('fs');

const file = 'src/components/pricing-module.tsx';
let content = fs.readFileSync(file, 'utf8');
let original = content;

// Replace background classes
content = content.replace(/bg-black\/20/g, 'bg-slate-50 dark:bg-black/20');
content = content.replace(/bg-black\/30/g, 'bg-white dark:bg-black/30');

// Replace border classes
content = content.replace(/border-white\/10/g, 'border-slate-300/60 dark:border-white/10');
content = content.replace(/border-white\/5/g, 'border-slate-300/60 dark:border-white/5');

// Replace hover classes
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-200 dark:hover:bg-white/5');
content = content.replace(/hover:text-white/g, 'hover:text-slate-900 dark:hover:text-white');

// Replace text colors
content = content.replace(/\btext-white\/80\b/g, 'text-slate-700 dark:text-white/80');

// Replace text-white safely (avoid double dark:text-white)
content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-white\b/g, 'text-slate-900 dark:text-white');

if (content !== original) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated pricing-module.tsx successfully.');
} else {
  console.log('No changes were made.');
}
