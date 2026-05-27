const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/pdf/themes/dark-theme.tsx');
const fileContent = fs.readFileSync(filePath, 'utf8');

const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

function visit(node) {
    if (node.kind === ts.SyntaxKind.JsxText) {
        const text = node.getText(sourceFile);
        if (text.includes('{') || text.includes('}')) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            console.log(`Found brace in JSX text at line ${line + 1}, char ${character + 1}: "${text}"`);
        }
    }
    ts.forEachChild(node, visit);
}

visit(sourceFile);
console.log('AST walk finished.');
