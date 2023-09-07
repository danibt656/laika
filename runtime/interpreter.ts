import {
    RuntimeVal, NumberVal, StringVal, MK_NULL, MK_BOOL,
    LoopBreakpoint, ReturnVal,
} from "./values.ts";
import {
    Identifier, BinaryExpr, NumericLiteral, Stmt, Program,
    VarDeclaration, AssignmentExpr, ObjectLiteral, CallExpr,
    FunctionDeclaration, StringLiteral, IfStmt, LogicalExpr,
    WhileLoop, UnaryExpr, ForLoop, ReturnStmt
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
    eval_identifier, eval_binary_expr, eval_assignment_expr,
    eval_object_expr, eval_call_expr, eval_if_else,
    eval_logical_expr, eval_unary_expr,
} from "./eval/expressions.ts";
import {
    eval_fn_declaration, eval_for_loop, eval_program, eval_var_declaration,
    eval_while_loop, eval_return_stmt
} from "./eval/statements.ts";

export type BodyType =
    | "loop"
    | "if-else"
    | "function"
    ;

export function evaluate(astNode: Stmt | undefined, env: Environment): RuntimeVal {
    if (!astNode)
        return MK_BOOL();

    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                value: (astNode as NumericLiteral).value,
                type: "number",
            } as NumberVal;

        case "StringLiteral":
            return {
                value: (astNode as StringLiteral).value,
                type: "string",
            } as StringVal;

        case "Identifier":
            return eval_identifier(astNode as Identifier, env);

        case "UnaryExpr":
            return eval_unary_expr(astNode as UnaryExpr, env);

        case "BinaryExpr":
            return eval_binary_expr(astNode as BinaryExpr, env);

        case "LogicalExpr":
            return eval_logical_expr(astNode as LogicalExpr, env);

        case "Program":
            return eval_program(astNode as Program, env);

        case "VarDeclaration":
            return eval_var_declaration(astNode as VarDeclaration, env);

        case "FunctionDeclaration":
            return eval_fn_declaration(astNode as FunctionDeclaration, env);

        case "IfStmt":
            return eval_if_else(astNode as IfStmt, env);

        case "WhileLoop":
            return eval_while_loop(astNode as WhileLoop, env);
        
        case "ForLoop":
            return eval_for_loop(astNode as ForLoop, env);

        case "LoopBreak":
            return { type: "loop-bp", value: "break" } as LoopBreakpoint;
        case "LoopPass":
            return { type: "loop-bp", value: "pass" } as LoopBreakpoint;

        case "AssignmentExpr":
            return eval_assignment_expr(astNode as AssignmentExpr, env);

        case "ObjectLiteral":
            return eval_object_expr(astNode as ObjectLiteral, env);

        case "CallExpr":
            return eval_call_expr(astNode as CallExpr, env);

        case "ReturnStmt":
            return eval_return_stmt(astNode as ReturnStmt, env);
            
        default:
            throw `This AST Node has not yet been setup for interpretation: ${JSON.stringify(astNode)}`;
    }
}

export function execute_stmt_body(body: Stmt[], scope: Environment, where: BodyType): RuntimeVal {
    let result: RuntimeVal = MK_NULL();
    for (const stmt of body) {
        result = evaluate(stmt, scope);
        // Account for break / pass statements
        if (result.type == "loop-bp") {
            if (where != "loop")
                throw `Cannot use ${(result as LoopBreakpoint).value} statement in non-loop body.`;
            return result;
        } else if (result.type == "return") {
            if (where == "if-else")
                return result;
            else if (where == "function")
                return (result as ReturnVal).value;
            else
                throw `Cannot use return statement in non-function nor conditional body.`;
        }
    }
    return result;
}