const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // text-emerald-400 -> text-emerald-600 dark:text-emerald-400
    // text-emerald-500 -> text-emerald-700 dark:text-emerald-500
    // text-emerald-300 -> text-emerald-700 dark:text-emerald-300
    
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-emerald-300\b/g, 'text-emerald-700 dark:text-emerald-300');
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-emerald-400\b/g, 'text-emerald-600 dark:text-emerald-400');
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\btext-emerald-500\b/g, 'text-emerald-700 dark:text-emerald-500');

    // Also do hover states
    content = content.replace(/(?<!\bdark:)\bhover:text-emerald-400\b/g, 'hover:text-emerald-600 dark:hover:text-emerald-400');
    
    // Backgrounds that might be too bright in light mode? Usually it's text that's the problem.
    // If bg-emerald-400 -> maybe leave it or make it bg-emerald-600
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-emerald-400\b(?!(\/))/g, 'bg-emerald-600 dark:bg-emerald-400');
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bbg-emerald-500\b(?!(\/))/g, 'bg-emerald-600 dark:bg-emerald-500');

    // border-emerald-400 -> border-emerald-600 dark:border-emerald-400
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bborder-emerald-300\b/g, 'border-emerald-600 dark:border-emerald-300');
    content = content.replace(/(?<!\bdark:)(?<!\bhover:)\bborder-emerald-400\b/g, 'border-emerald-600 dark:border-emerald-400');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
    }
  }
});

console.log(`Updated emerald colors in ${modifiedCount} files.`);
