const lucide = require('lucide-react');
const icons = ['Tag', 'ReceiptText', 'Phone', 'Hash', 'Receipt', 'LucideTag', 'LucidePhone', 'LucideHash'];
icons.forEach(k => {
    console.log(`${k}: ${!!lucide[k]}`);
});
