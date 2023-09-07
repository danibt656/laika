import {
ForLoop,
    FunctionDeclaration, Program, VarDeclaration, WhileLoop, ReturnStmt
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate, execute_stmt_body } from "../interpreter.ts";
import {
    RuntimeVal,MK_NULL, FnVal, isTruthy, LoopBreakpoint, ReturnVal,
    NumberVal
} from "../values.ts";

export function eval_program(program: Program, env: Environment): RuntimeVal {
    let lastEvaluated: RuntimeVal = MK_NULL();

    for (const statement of program.body)
        lastEvaluated = evaluate(statement, env);

    return lastEvaluated;
}

export function eval_var_declaration(decl: VarDeclaration, env: Environment): RuntimeVal {
    const value = decl.value 
        ? evaluate(decl.value, env)
        : MK_NULL();

    return env.declareVar(decl.identifier, value, decl.constant);
}

export function eval_fn_declaration(decl: FunctionDeclaration, env: Environment): RuntimeVal {
    const fn = {
        type: "function",
        name: decl.name,
        parameters: decl.parameters,
        declarationEnv: env,
        body: decl.body,
    } as FnVal;

    return env.declareVar(decl.name, fn, true);
}

export function eval_while_loop(loop: WhileLoop, env: Environment): RuntimeVal {
    let result: RuntimeVal = MK_NULL();
    while (isTruthy(evaluate(loop.loop_condition, env))) {
        result = execute_stmt_body(loop.body, env, "loop");
        if (result.type == "loop-bp") {
            if ((result as LoopBreakpoint).value == "break") break;
            if ((result as LoopBreakpoint).value == "pass") continue;
        }
    }
    
    return MK_NULL();
}

export function eval_for_loop(loop: ForLoop, env: Environment): RuntimeVal {
    if (loop.initializer)
        evaluate(loop.initializer, env);

    let result: RuntimeVal = MK_NULL();
    while (isTruthy(evaluate(loop.loop_condition, env))) {
        result = execute_stmt_body(loop.body, env, "loop");
        if (result.type == "loop-bp") {
            if ((result as LoopBreakpoint).value == "break") break;
            if ((result as LoopBreakpoint).value == "pass") continue;
        }
        if (loop.increment)
            evaluate(loop.increment, env);
    }
    
    return MK_NULL();
}

export function eval_return_stmt(stmt: ReturnStmt, env: Environment): RuntimeVal {
    const value: RuntimeVal = evaluate(stmt.value, env);
    const retVal = { type: "return", value: value } as ReturnVal;

    // If we are on top-level env, return is same as exit
    if (env.isGlobal()) {
        if (value.type != "number") throw `Can only use number values in top-level return statement.`
        Deno.exit((value as NumberVal).value);
    }
    return retVal;
}