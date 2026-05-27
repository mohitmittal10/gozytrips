const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/pdf/themes/dark-theme.tsx');
console.log('Checking file:', filePath);

const fileContent = fs.readFileSync(filePath, 'utf8');

const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

const diagnostics = sourceFile.parseDiagnostics;

if (diagnostics.length === 0) {
    console.log('No syntax errors found by TypeScript compiler parser!');
} else {
    console.log('Found syntactic diagnostics:');
    diagnostics.forEach(diag => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);
        console.log(`Error at line ${line + 1}, char ${character + 1}: ${diag.messageText}`);
    });
}
