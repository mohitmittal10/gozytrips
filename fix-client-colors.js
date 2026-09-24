const fs = require('fs');
const file = 'src/components/the-lab/TheLabSummaryPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace text-white for client name
content = content.replace(/text-white text-base truncate">\{selectedClient\.name\}/g, 'text-slate-900 dark:text-white text-base truncate">{selectedClient.name}');

// replace text-slate-300 for email and phone
content = content.replace(/text-slate-300 truncate">\{selectedClient\.email\}/g, 'text-slate-900 dark:text-slate-300 truncate">{selectedClient.email}');
content = content.replace(/text-slate-300">\{selectedClient\.phone\}/g, 'text-slate-900 dark:text-slate-300">{selectedClient.phone}');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed client details colors.');
