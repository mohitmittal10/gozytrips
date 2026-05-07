const lucide = require('lucide-react');
const targets = ['Tag', 'ReceiptText', 'Phone', 'Hash', 'Receipt', 'PhoneCall', 'HashIcon', 'Tags'];
console.log('Available icons:', Object.keys(lucide).filter(k => targets.includes(k) || k.toLowerCase().includes('phone') || k.toLowerCase().includes('tag') || k.toLowerCase().includes('hash') || k.toLowerCase().includes('receipt')));
