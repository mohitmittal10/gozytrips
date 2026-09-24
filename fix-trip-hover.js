const fs = require('fs');

const file = 'src/components/the-lab/TheLabSummaryPanel.tsx';
let content = fs.readFileSync(file, 'utf8');
let original = content;

// fix hover:text-white on the downward arrow
content = content.replace(/className="p-1 text-slate-600 dark:text-zinc-400 hover:text-white transition-colors"/g, 'className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"');

// fix hover:text-white on the Edit button
content = content.replace(/hover:bg-primary\/20 hover:text-white hover:border-primary\/40/g, 'hover:bg-primary/20 hover:text-primary-800 dark:hover:text-white hover:border-primary/40');

if (content !== original) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed hover colors in TheLabSummaryPanel.');
} else {
  console.log('No changes were made.');
}
