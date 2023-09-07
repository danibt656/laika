// Defines Token types and interfaces
// author: Daniel Barahona

export enum TokenType {
    // Literal types
    Identifier,
    Number,
    String,

    // Keywords
    Mut,  // mutable var
    Keep, // constant
    Fn,
    If, Else,
    Or, And,
    While, For,
    Break, Pass,
    Return,
    
    // Grouping * Operators
    OpenParen, CloseParen, // ( )
    OpenBrace, CloseBrace, // { }
    OpenBracket, CloseBracket, // [ ]
    Equals,
    BinaryOperator,
    UnaryOperator,
    LogicalOperator,
    Semicolon,
    Colon,
    Comma,
    Dot,
    DoubleQuote,

    // End of File
    EOF,
}

const KEYWORDS: Record<string, TokenType> = {
    'mut': TokenType.Mut,
    'keep': TokenType.Keep,
    'fn': TokenType.Fn,
    'if': TokenType.If,
    'else': TokenType.Else,
    'or': TokenType.Or,
    'and': TokenType.And,
    'while': TokenType.While,
    'for': TokenType.For,
    'break': TokenType.Break,
    'pass': TokenType.Pass,
    'return': TokenType.Return,
}

export interface Token {
    value: string,
    type: TokenType,
}

function token(value = "", type: TokenType): Token {
    return { value, type };
}

function isalpha(src: string): boolean {
    const SPECIAL_CHARS = ["_"];
    return (src.toUpperCase() != src.toLowerCase())
        || SPECIAL_CHARS.includes(src);
}

function isint(str: string) {
    const c = str.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
    return (c >= bounds[0] && c <= bounds[1]);
}

function isskippable(str: string) {
    return str == ' ' || str == '\n' || str == '\t' || str == '\r';
}

function isnewline(str: string) {
    return str == '\n' || str == '\r';
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    // Build each token until EOF
    while (src.length > 0) {
        if (src[0] == '(')
            tokens.push(token(src.shift(), TokenType.OpenParen));
        else if (src[0] == ')')
            tokens.push(token(src.shift(), TokenType.CloseParen));

        else if (src[0] == '{')
            tokens.push(token(src.shift(), TokenType.OpenBrace));
        else if (src[0] == '}')
            tokens.push(token(src.shift(), TokenType.CloseBrace));

        else if (src[0] == '[')
            tokens.push(token(src.shift(), TokenType.OpenBracket));
        else if (src[0] == ']')
            tokens.push(token(src.shift(), TokenType.CloseBracket));

        else if (  src[0] == '*'
                || src[0] == '/'
                || src[0] == '%'
            )
            tokens.push(token(src.shift(), TokenType.BinaryOperator));

        else if (src[0] == ';')
            tokens.push(token(src.shift(), TokenType.Semicolon));
        else if (src[0] == ':')
            tokens.push(token(src.shift(), TokenType.Colon));
        else if (src[0] == ',')
            tokens.push(token(src.shift(), TokenType.Comma));
        else if (src[0] == '.')
            tokens.push(token(src.shift(), TokenType.Dot));

        else { // Handle multicharacter tokens

            // Single-line comments
            if (src[0] == '#') {
                while (!isnewline(src[0]))
                    src.shift();
            }

            // number token
            if (isint(src[0])) {
                let num = "";
                while (src.length > 0 && isint(src[0]))
                    num += src.shift();
                
                tokens.push(token(num, TokenType.Number));

            // alphanum token
            } else if (isalpha(src[0])) {
                let ident = "";
                while (src.length > 0 && (isalpha(src[0]) || isint(src[0])))
                    ident += src.shift();
                
                // Check for reserved keywords
                const reserved = KEYWORDS[ident];
                if (typeof reserved == "number")
                    tokens.push(token(ident, reserved));
                else
                    tokens.push(token(ident, TokenType.Identifier));

            // string
            } else if (src[0] == '"') {
                src.shift(); // pass opening quote
                let str = "";
                while (src.length > 0 && !isnewline(src[0]) && src[0] != '"')
                    str += src.shift();

                if (isnewline(src[0]))
                    throw `String must be closed with a matching quote.`
                if (src[0] == '"')
                src.shift(); // pass closing quote
                tokens.push(token(str, TokenType.String));

            // logical >, >=, <, <= operators
            } else if (src[0] == '<' || src[0] == '>') {
                let operator = src[0];
                if (src[1] == "=") {
                    operator += src[1];
                    src.shift();
                }
                src.shift();
                
                tokens.push(token(operator, TokenType.LogicalOperator));

            // logical != operator
            } else if (src[0] == '!') {
                let operator = src[0];
                if (src[1] == "=") {
                    operator += src[1];
                    src.shift(); src.shift();
                    tokens.push(token(operator, TokenType.LogicalOperator));
                } else {
                    src.shift();
                    tokens.push(token(operator, TokenType.UnaryOperator));
                }

            // equals = / logical operator ==
            } else if (src[0] == '=') {
                let operator = src[0];
                if (src[1] == "=") {
                    operator += src[1];
                    src.shift(); src.shift();
                    tokens.push(token(operator, TokenType.LogicalOperator));
                } else {
                    src.shift();
                    tokens.push(token(operator, TokenType.Equals));
                }
                
            // binary sum + / autoincrement ++
            } else if (src[0] == '+') {
                let operator = src[0];
                if (src[1] == "+") {
                    operator += src[1];
                    src.shift(); src.shift();
                    tokens.push(token(operator, TokenType.UnaryOperator));
                } else {
                    src.shift();
                    tokens.push(token(operator, TokenType.Equals));
                } 
            
            // binary sum + / autoincrement ++
            } else if (src[0] == '-') {
                let operator = src[0];
                if (src[1] == "-") {
                    operator += src[1];
                    src.shift(); src.shift();
                    tokens.push(token(operator, TokenType.UnaryOperator));
                } else {
                    src.shift();
                    tokens.push(token(operator, TokenType.Equals));
                }
                
            // Skippable characters
            } else if (isskippable(src[0])) {
                src.shift();

            // Not recognized
            } else {
                throw `Unrecognized character: ${src[0]}`;
            }
        }
    }

    tokens.push({ type: TokenType.EOF, value: "EOF" });
    return tokens;
}