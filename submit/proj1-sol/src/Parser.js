const Lexer = require('./Lexer');

class Parser {
    // Initialize parser
    constructor(tokens) {
        this.tokens = tokens;
        this.currentTokenIndex = 0;
    }

    // Get current token from current index
    get currentToken() {
        return this.tokens[this.currentTokenIndex];
    }

    // Advance to next token (unless EOF)
    advance() {
        this.currentTokenIndex = this.currentToken.type !== "EOF" ? this.currentTokenIndex + 1 : this.currentTokenIndex;
    }

    // Iterate over tokens and construct AST
    parse() {
        const ast = [];

        // Map token types to their respective parsing functions w/ handlers
        const handlers = {
            "INTEGER": this.parseInt.bind(this),
            "ATOM": this.parseAtom.bind(this),
            "BOOLEAN": this.parseBool.bind(this),
            "LIST_START": this.parseList.bind(this),
            "TUPLE_START": this.parseTuple.bind(this),
            "MAP_START": this.parseMap.bind(this)
        };

         // Loop through all tokens until EOF
        while (this.currentToken.type !== "EOF") {
            const handler = handlers[this.currentToken.type];
            if (handler) {
                // Use appropriate handler per token type
                ast.push(handler());
            } else {
                console.error(`Unknown token type: ${this.currentToken.type}`);
                this.advance(); // Skip unknown tokens
            }
        }
        return ast;
    }

    // Parse a sequence of data literals by current token type (until structure end or EOF)
    parseSentence() {
        let elements = [];
        while (this.currentToken.type !== "EOF" &&
            this.currentToken.type !== "LIST_END" &&
            this.currentToken.type !== "TUPLE_END" &&
            this.currentToken.type !== "MAP_END") {
            elements.push(this.parseDataLiteral());
        }
        return elements;
    }

    // Parse data literals by current token type
    parseDataLiteral() {
        switch (this.currentToken.type) {
            case "INTEGER":
                return this.parseInt();
            case "ATOM":
                return this.parseAtom();
            case "BOOLEAN":
                return this.parseBool();
            case "LIST_START":
                return this.parseList();
            case "TUPLE_START":
                return this.parseTuple();
            case "MAP_START":
                return this.parseMap();
            case "ERROR":
                throw new Error(`Syntax error: Invalid token ${this.currentToken.value}`);
            default:
                throw new Error(`Unexpected token: ${this.currentToken.type}`);
        }
    }

    // Parse Integer from current token value
    parseInt() {
        const value = this.currentToken.value;
        this.advance(); 
        return { "%k": "int", "%v": value };
    }

    // Parse Atom from current token value    
    parseAtom() {
        const value = this.currentToken.value;
        this.advance();
        return { "%k": "atom", "%v": value };
    }

    // Parse Boolean from current token value
    parseBool() {
        const value = this.currentToken.value;
        this.advance(); 
        return { "%k": "bool", "%v": value };
    }

    // Parse List from from current token type (until LIST_END, and handling commas)
    parseList() {
        this.advance(); // Move past LIST_START
        let items = [], tokenType;

        // Loop through tokens until end of list
        while ((tokenType = this.currentToken.type) !== "LIST_END") {

            // Throw if EOF is before proper closure
            if (tokenType === "EOF") throw new Error("End of file reached while parsing a list");

            // Handle commas between list items, no trailing commas
            if (tokenType === "COMMA") {
                this.advance(); 
                if (this.currentToken.type in { "LIST_END": 1, "EOF": 1 })
                    throw new Error("List cannot end with a trailing comma");
                continue;
            }
            // Parse current and add to list
            items.push(this.parseDataLiteral());
        }
        this.advance(); // Move past LIST_END
        return { "%k": "list", "%v": items };
    }

    // Parse Tuple from from current token type (until TUPLE_END, and proper syntax)
    parseTuple() {
        this.advance(); // Move past TUPLE_START
        let items = [], expectingValue = true;

        // Loop through tokens until end of tuple
        while (this.currentToken.type !== "TUPLE_END") {

            // Throw if EOF is before proper closure
            if (this.currentToken.type === "EOF") throw new Error("End of file reached while parsing a tuple");

            // Handle commas between list items, no commas without preceding value
            if (this.currentToken.type === "COMMA") {
                if (expectingValue || items.length === 0) throw new Error("Unexpected comma in tuple");
                this.advance(); 
                expectingValue = true;
            } else {
                // Parse current and add to tuple
                items.push(this.parseDataLiteral());
                expectingValue = false;
            }
        }
        // Ensure no trailing comma
        if (expectingValue && items.length > 0) throw new Error("Tuple cannot end with a trailing comma");

        this.advance(); // Move past TUPLE_END

        // Ensure no extra closing delimiters after tuple
        if (["TUPLE_END", "LIST_END", "MAP_END"].includes(this.currentToken.type)) {
            throw new Error("Unexpected extra closing delimiter after tuple");
        }
        return { "%k": "tuple", "%v": items };
    }

    // Parse Map from from current token type (until MAP_END, handling key-value pairs)
    parseMap() {
        this.advance(); // Move past MAP_START
        let items = [], expectingKey = true, key;

        // Loop through tokens until end of map
        while (this.currentToken.type !== "MAP_END") {

            // Throw if EOF is before proper closure
            if (this.currentToken.type === "EOF") {
                throw new Error("End of file reached while parsing a map");
            }

            // Handle commas between list items, no commas without preceding pair
            if (this.currentToken.type === "COMMA") {
                if (expectingKey || items.length === 0) throw new Error("Unexpected comma in map");
                this.advance(); 
                expectingKey = true;
            } else {
                // If expecting key, parse key and expect arrow token
                if (expectingKey) {
                    key = this.parseDataLiteral();
                    if (this.currentToken.type !== "ARROW") throw new Error("Map entry must be followed by '=>'");
                    this.advance();
                    expectingKey = false;
                } else {
                    // Parse value and add key-value pair to map
                    let value = this.parseDataLiteral();
                    items.push([key, value]);
                    expectingKey = true;
                }
            }
        }
        // Ensure no trailing comma
        if (!expectingKey) throw new Error("Map cannot end with a trailing comma");

        this.advance(); // Move past the MAP_END

        // Ensure no extra closing delimiters after tuple
        if (["TUPLE_END", "LIST_END", "MAP_END"].includes(this.currentToken.type)) {
            throw new Error("Unexpected extra closing delimiter after map");
        }
        return { "%k": "map", "%v": items };
    }
}

module.exports = Parser;