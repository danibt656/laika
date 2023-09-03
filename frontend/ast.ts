// Defines Node & AST types
// author: Daniel Barahona

export type NodeType =
    // Statements
    | "Program"
    | "VarDeclaration"
    | "FunctionDeclaration"
    | "IfStmt"
    | "WhileLoop"
    | "ForLoop"
    | "LoopBreak"
    | "LoopPass"

    // Expressions
    | "BinaryExpr"
    | "UnaryExpr"
    | "LogicalExpr"
    | "AssignmentExpr"
    | "MemberExpr"
    | "CallExpr"
    
    // Literals
    | "Identifier"
    | "NumericLiteral"
    | "StringLiteral"
    | "Property"
    | "ObjectLiteral"
;

export interface Stmt {
    kind: NodeType;
}

export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

export interface VarDeclaration extends Stmt {
    kind: "VarDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expr;
}

export interface FunctionDeclaration extends Stmt {
    kind: "FunctionDeclaration";
    name: string;
    parameters: string[];
    body: Stmt[];
}

export interface IfStmt extends Stmt {
    kind: "IfStmt";
    if_condition: Expr;
    then_branch: Stmt[];
    else_branch?: Stmt[];
}

export interface WhileLoop extends Stmt {
    kind: "WhileLoop";
    loop_condition: Expr;
    body: Stmt[];
}

export interface ForLoop extends Stmt {
    kind: "ForLoop";
    initializer: Expr | VarDeclaration;
    loop_condition: Expr;
    increment: Expr;
    body: Stmt[];
}

export interface LoopBreak extends Stmt {
    kind: "LoopBreak";
}

export interface LoopPass extends Stmt {
    kind: "LoopPass";
}

export interface Expr extends Stmt {}

export interface UnaryExpr extends Expr {
    kind: "UnaryExpr";
    right: Expr;
    operator: string;
}

export interface BinaryExpr extends Expr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface LogicalExpr extends Expr {
    kind: "LogicalExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface MemberExpr extends Expr {
    kind: "MemberExpr";
    object: Expr;
    property: Expr;
    computed: boolean;
}

export interface CallExpr extends Expr {
    kind: "CallExpr";
    args: Expr[];
    caller: Expr;
}

export interface Identifier extends Expr {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expr {
    kind: "NumericLiteral";
    value: number;
}

export interface StringLiteral extends Expr {
    kind: "StringLiteral";
    value: string;
}

export interface AssignmentExpr extends Expr {
    kind: "AssignmentExpr";
    assignee: Expr;
    value: Expr;
}

export interface Property extends Expr {
    kind: "Property";
    key: string;
    value?: Expr;
}

export interface ObjectLiteral extends Expr {
    kind: "ObjectLiteral";
    properties: Property[];
}