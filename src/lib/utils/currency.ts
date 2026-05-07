export const formatCurrency = (val: string | number, currencyCode: string = 'INR') => {
    if (!val) return "0";
    const numMatch = String(val).match(/[\d,.]+/);
    if (!numMatch) return "0";
    const numStr = numMatch[0].replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? "0" : num.toLocaleString('en-IN', { 
        style: 'currency', 
        currency: currencyCode, 
        maximumFractionDigits: 0 
    }).replace(/[A-Z]{3}/, '').trim(); // Remove ISO code if it fails to find symbol
};

export const formatMoneyWithDecimals = (amount: number, currencyCode: string = 'INR') => {
    return amount.toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
};
