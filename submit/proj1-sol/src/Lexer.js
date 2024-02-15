// Represent lexical tokens with type and value
class Token {
    constructor(type, value = '') {
        this.type = type;
        this.value = value;
    }
}

// Lexer class for tokenizing input strings
class Lexer {
    constructor(input) {
        this.input = input;         // String input to tokenize.
        this.index = 0;             // Current position in input
        this.length = input.length; // Total length of input (for bounds checking)
    }

    // Peek at character of current index + ahead without advancing
    peek(ahead = 0) {
        return this.index + ahead < this.length ? this.input[this.index + ahead] : null;
    }

    // Advance current index
    advance(steps = 1) {
        this.index += steps;
    }

    // Skip whitespace and comments in input
    skipWhitespaceAndComments() {
        let skipped = false; // Flag to indicate skipped
        while (this.index < this.input.length) {
            const char = this.input[this.index];
            const nextChar = this.index + 1 < this.input.length ? this.input[this.index + 1] : null;

            // Skip spaces, newlines, tabs, and carriage returns
            if (char === ' ' || char === '\n' || char === '\t' || char === '\r') {
                skipped = true;
                this.index++; // Move to the next character
            }
            // Skip comment lines
            else if (char === '#' && nextChar !== null) {
                skipped = true;
                // Skip entire comment line
                while (this.index < this.input.length && this.input[this.index] !== '\n') {
                    this.index++; // Move past the comment characters
                }
            } else {
                break; // Not whitespace or comment start, stop skipping
            }
        }
        return skipped; // Return flag
    }

    // Determine and return next token in input
    getNextToken() {
        // Skip leading whitespace or comments. Return EOF if end of input is reached
        if (this.skipWhitespaceAndComments() && this.index >= this.input.length) {
            return new Token("EOF");
        }
        if (this.index >= this.input.length) return new Token("EOF");

        const currentChar = this.peek(); // Get current character to determine next token

        // Determine token type to create
        switch (currentChar) {
            case ':': // Potential atom or colon
                // If followed by alphabetic character, parse as atom
                if (/[a-zA-Z_]/.test(this.peek(1))) {
                    return this.atom(); 
                } else {
                    this.advance();
                    return new Token("COLON", ":");
                }
            case 't':
            case 'f':
                return this.boolean(); // Handle both true and false
            case ',':
                this.advance();
                return new Token("COMMA");
            case '[':
                this.advance();
                return new Token("LIST_START", "[");
            case ']':
                this.advance();
                return new Token("LIST_END", "]");
            case '{':
                this.advance();
                return new Token("TUPLE_START", "{");
            case '}':
                this.advance();
                return new Token(this.peek(-1) === '%' ? "MAP_END" : "TUPLE_END", "}");
            case '%':
                if (this.peek(1) === '{') {
                    this.advance(2); // Special case for map start token
                    return new Token("MAP_START", "%{");
                } else {
                    this.advance();
                    return new Token("UNKNOWN", currentChar);
                }
                // Fall through to default case if not followed by '{'
            case '=':
                if (this.peek(1) === '>') {
                    this.advance(2);
                    return new Token("ARROW", "=>");
                } else {
                    this.advance();
                    return new Token("UNKNOWN", currentChar);
                }
                // Fall through to default case if not followed by '>'
            default:
                if (/\d/.test(currentChar)) return this.integer(); // Parse integers
                this.advance(); // Advance past unknown or unhandled characters
                return new Token("UNKNOWN", currentChar);
        }
    }

    // Parse integer (handling underscores as digit separators)
    integer() {
        let result = '';
        let hasUnderscore = false; // Flag to track presence of underscores
        while (this.index < this.input.length && (/[\d_]/).test(this.input[this.index])) {
            let currentChar = this.input[this.index];
            // Check for misuse of underscores
            if (currentChar === '_') {
                if (result === '' || hasUnderscore || this.index + 1 >= this.input.length || !/\d/.test(this.input[this.index + 1])) {
                    throw new Error("Invalid integer format: underscores must be between digits");
                }
                hasUnderscore = true;
            } else {
                result += currentChar;
                hasUnderscore = false; // Reset underscore flag after digit
            }
            this.index++;
        }
        return new Token("INTEGER", parseInt(result, 10));
    }

    // Parse an atom
    atom() {
        let result = ':';
        this.index++; // Skip initial ':' character
        while (this.index < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.index])) {
            result += this.input[this.index]; // Append valid characters to atom name
            this.index++;
        }
        return new Token("ATOM", result);
    }

    // Parse a boolean
    boolean() {
        let result = '';
        while (this.index < this.input.length && /[a-zA-Z]/.test(this.input[this.index])) {
            result += this.input[this.index]; // Build boolean string
            this.index++;
        }
        // Return error token for invalid boolean strings
        if (result !== "true" && result !== "false") {
            return new Token("ERROR", `Invalid boolean: ${result}`);
        }
        return new Token("BOOLEAN", result === "true");
    }
}

module.exports = Lexer;