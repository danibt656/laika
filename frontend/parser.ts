import {
    Stmt, Program, Expr, BinaryExpr,
    NumericLiteral, Identifier, VarDeclaration, AssignmentExpr,
    Property, ObjectLiteral, CallExpr, MemberExpr, FunctionDeclaration,
    StringLiteral, IfStmt, LogicalExpr, WhileLoop, UnaryExpr
} from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];

    private not_eof(): boolean {
        return this.at().type != TokenType.EOF;
    }

    private at() {
        return this.tokens[0] as Token;
    }

    private eat() {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type != type) {
            throw `Parser Error: ${err} ${prev} - Expecting: ${type})`;
        }
        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode)
        const program: Program = {
            kind: "Program",
            body: [],
        }

        // Parse until end of file
        while (this.not_eof()) {
            program.body.push(this.parse_stmt());
        }

        return program;
    }

    private parse_stmt(): Stmt {
        // skip to parse_expr
        switch (this.at().type) {
            case TokenType.Mut:
            case TokenType.Keep:
                return this.parse_var_declaration();

            case TokenType.Fn:
                return this.parse_function_declaration();

            case TokenType.If:
                return this.parse_if_else();

            case TokenType.While:
                return this.parse_while_loop();

            default:
                return this.parse_expr();
        }
    }

    // (keep | mut) ident [= expr]
    private parse_var_declaration(): Stmt {
        const isConstant = this.eat().type == TokenType.Keep;
        const identifier = this.expect(
            TokenType.Identifier,
            "Expected identifier name following mut | keep keywords."
        ).value;

        if (this.at().type == TokenType.Semicolon) {
            this.eat(); // expect semicolon
            if (isConstant)
                throw `Cannot declare constant expression '${identifier}' without a value.`;

            return {
                kind: "VarDeclaration",
                identifier: identifier,
                constant: false,
            } as VarDeclaration;
        }

        this.expect(TokenType.Equals, "Expected equals following identifier in var declaration.");

        const var_decl = {
            kind: "VarDeclaration",
            identifier: identifier,
            constant: isConstant,
            value: this.parse_expr(),
        } as VarDeclaration;

        // this.expect(TokenType.Semicolon, "Var declaration statement must end with ';'.");
        return var_decl;
    }

    private parse_function_declaration(): Stmt {
        this.eat(); // pass fn keyword
        const name = this.expect(TokenType.Identifier, "A function name was expected.").value;

        const args = this.parse_args();
        const params: string[] = [];

        // Parameters
        for (const arg of args) {
            if (arg.kind !== "Identifier")
                throw `Inside function ${name} declaration expected parameter ${arg} to be of type string.`
            params.push((arg as Identifier).symbol);
        }

        // Body
        this.expect(TokenType.OpenBrace, "Expected function body following declaration.");

        const body: Stmt[] = [];
        while (this.not_eof() && this.at().type != TokenType.CloseBrace)
            body.push(this.parse_stmt());

        this.expect(TokenType.CloseBrace, "Expected closing bracket after function body.")

        const fn_decl = {
            kind: "FunctionDeclaration",
            name: name,
            parameters: params,
            body: body,
        } as FunctionDeclaration;
        return fn_decl;
    }

    private parse_if_else(): Stmt {
        this.eat(); // Pass if keyword

        // If condition
        this.expect(TokenType.OpenParen, "Expected parenthesized condition in if statement.");
        const if_condition = this.parse_expr();
        this.expect(TokenType.CloseParen, "Expected parenthesized condition in if statement.");

        // eat If body
        this.expect(TokenType.OpenBrace, "Expected if body following declaration.");

        const then_branch: Stmt[] = [];
        while (this.not_eof() && this.at().type != TokenType.CloseBrace)
            then_branch.push(this.parse_stmt());

        this.expect(TokenType.CloseBrace, "Expected closing bracket after if body.")
        
        // There is else body
        const else_branch: Stmt[] = [];
        if (this.at().type == TokenType.Else) {
            this.eat(); // Pass else keyword
            
            // // Else-if
            // if (this.at().type == TokenType.If) {
            //     const nested_if: Stmt = this.parse_if_else();
            // }
            // // Else only
            // else {
                // eat Else body
                this.expect(TokenType.OpenBrace, "Expected else body following declaration.");

                while (this.not_eof() && this.at().type != TokenType.CloseBrace)
                    else_branch.push(this.parse_stmt());

                this.expect(TokenType.CloseBrace, "Expected closing bracket after else body.")
            // }
        }

        const ifstmt = {
            kind: "IfStmt",
            if_condition: if_condition,
            then_branch: then_branch,
            else_branch: else_branch,
        } as IfStmt;

        return ifstmt;
    }

    private parse_while_loop(): Stmt {
        this.eat(); // Pass while keyword

        // If condition
        this.expect(TokenType.OpenParen, "Expected parenthesized condition in while loop.");
        const loop_condition = this.parse_expr();
        this.expect(TokenType.CloseParen, "Expected parenthesized condition in while loop.");

        // eat body
        this.expect(TokenType.OpenBrace, "Expected while loop body.");

        const body: Stmt[] = [];
        while (this.not_eof() && this.at().type != TokenType.CloseBrace)
            body.push(this.parse_stmt());

        this.expect(TokenType.CloseBrace, "Expected closing bracket after while loop.")

        const while_loop = {
            kind: "WhileLoop",
            loop_condition: loop_condition,
            body: body,
        } as WhileLoop;

        return while_loop;
    }

    private parse_expr(): Expr {
        return this.parse_assignment_expr();
    }
    
    // --- Orders of Precedence ---
    //
    // Assignment
    // Object
    // Logical Or
    // Logical And
    // AdditiveExpr
    // MultiplicativeExpr
    // Call
    // Member
    // PrimaryExpr
    
    private parse_assignment_expr(): Expr {
        const left = this.parse_object_expr();

        if (this.at().type == TokenType.Equals) {
            this.eat(); // advance past equals
            const value = this.parse_assignment_expr();
            return { kind: "AssignmentExpr", assignee: left, value: value} as AssignmentExpr;
        }

        return left;
    }

    private parse_object_expr(): Expr {
        if (this.at().type !== TokenType.OpenBrace)
            return this.parse_not_expr();
        this.eat(); // past open brance

        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const key = this.expect(TokenType.Identifier, "Object literal key expected.").value;

            // allow shorthand key:pair -> {key,}
            if (this.at().type == TokenType.Comma) {
                this.eat(); // advance past comma
                properties.push({kind: "Property", key});
                continue;
            // allow shorthand key:pair -> {key}
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({kind: "Property", key});
                continue;
            }
            
            // allow normal case: { key:value, ...}
            this.expect(TokenType.Colon, "':' expected in key assignment.");
            const value = this.parse_expr();
            properties.push({kind: "Property", key, value});

            if (this.at().type != TokenType.CloseBrace)
                this.expect(TokenType.Comma, "Expected comma or close brace following property.");
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace");
        return { kind: "ObjectLiteral", properties: properties } as ObjectLiteral;
    }

    private parse_not_expr(): Expr {
        if (this.at().type == TokenType.LogicalOperator
            && this.at().value == "!") {
            const operator = this.at().value;
            this.eat(); // pass ! operator
            return {
                kind: "UnaryExpr",
                left: this.parse_or_expr(),
                operator,
            } as UnaryExpr;
        }
        return this.parse_or_expr();
    }

    private parse_or_expr(): Expr {
        let left = this.parse_and_expr();

        while (this.at().type == TokenType.Or) {
            const operator = this.eat().value;
            const right = this.parse_and_expr();
            left = {
                kind: "LogicalExpr",
                left,
                right,
                operator,
            } as LogicalExpr;
        }
        return left;
    }

    private parse_and_expr(): Expr {
        let left = this.parse_logical_operation();

        while (this.at().type == TokenType.And) {
            const operator = this.eat().value;
            const right = this.parse_logical_operation();
            left = {
                kind: "LogicalExpr",
                left,
                right,
                operator,
            } as LogicalExpr;
        }
        return left;
    }

    private parse_logical_operation(): Expr {
        let left = this.parse_additive_expr();

        while (this.at().value == ">"
            || this.at().value == ">="
            || this.at().value == "<"
            || this.at().value == "<="
            || this.at().value == "=="
            || this.at().value == "!=") {
            const operator = this.eat().value;
            const right = this.parse_additive_expr();
            left = {
                kind: "LogicalExpr",
                left,
                right,
                operator,
            } as LogicalExpr;
        }
        return left;
    }

    private parse_additive_expr(): Expr {
        let left = this.parse_multiplicative_expr();

        while (this.at().value == "+"
            || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
        }
        return left;
    }

    private parse_multiplicative_expr(): Expr {
        let left = this.parse_call_member_expr();

        while (this.at().value == "*"
            || this.at().value == "/"
            || this.at().value == "%"
        ) {
            const operator = this.eat().value;
            const right = this.parse_primary_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
        }
        return left;
    }

    private parse_call_member_expr(): Expr {
        const member = this.parse_member_expr();

        if (this.at().type == TokenType.OpenParen)
            return this.parse_call_expr(member);
        return member;
    }

    private parse_call_expr(caller: Expr): Expr {
        let call_expr: Expr = {
            kind: "CallExpr",
            args: this.parse_args(),
            caller,
        } as CallExpr;
        
        // allow foo(x,y)(z)
        if (this.at().type == TokenType.OpenParen)
            call_expr = this.parse_call_expr(call_expr);

        return call_expr;
    }

    private parse_args(): Expr[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis.");

        const args = this.at().type == TokenType.CloseParen
            ? []
            : this.parse_argument_list();

        this.expect(TokenType.CloseParen, "Missing close parenthesis of argument list.");
        return args;
    }

    private parse_argument_list(): Expr[] {
        const args = [this.parse_expr()];

        while (this.at().type == TokenType.Comma && this.eat())
            args.push(this.parse_assignment_expr());

        return args;
    }

    private parse_member_expr(): Expr {
        let object = this.parse_primary_expr();

        while (
            this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket
        ) {
            const operator = this.eat();
            let property: Expr;
            let computed: boolean;

            if (operator.type == TokenType.Dot) {
                // non-computed values aka obj.expr
                computed = false;
                property = this.parse_primary_expr(); // get identifier

                if (property.kind != "Identifier")
                    throw `Cannot use dot operator without right hand identifier.`;
            } else {
                // this allows obj[computedValue]
                computed = true;
                property = this.parse_expr();
                this.expect(TokenType.CloseBracket, "Missing close bracket in computed value.");
            }

            object = {
                kind: "MemberExpr",
                object,
                property,
                computed,
            } as MemberExpr;
        }

        return object;
    }

    private parse_primary_expr(): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value
                } as Identifier;

            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value)
                } as NumericLiteral;

            case TokenType.String:
                return {
                    kind: "StringLiteral",
                    value: this.eat().value as string,
                } as StringLiteral;
            
            case TokenType.OpenParen: {
                this.eat(); // eat the (
                const value = this.parse_expr();
                this.expect(
                    TokenType.CloseParen,
                    "Unexpected token found inside parenthesised expression. Expected closing parenthesis."
                ); // eat the )
                return value;
            }

            // Trick the compiler for TS
            default:
                throw `Unexpected token found during parsing ${JSON.stringify(this.at())}`;
        }
    }
}

