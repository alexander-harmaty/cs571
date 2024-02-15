const fs = require('fs');
const Lexer = require('./Lexer');
const Parser = require('./Parser');

function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.resume();
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
    });
}

async function main() {
    try {
        const input = await readStdin();
        const lexer = new Lexer(input);
        const tokens = [];
        let token;
        do {
            token = lexer.getNextToken();
            if (token.type === "ERROR") {
                throw new Error(`Lexical error: ${token.value}`);
            }
            tokens.push(token);
        } while (token.type !== "EOF");
        const parser = new Parser(tokens);
        const ast = parser.parse();
        console.log(JSON.stringify(ast));
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

main();