import {
    FunctionDeclaration, Program, VarDeclaration, WhileLoop
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate, execute_stmt_body } from "../interpreter.ts";
import { RuntimeVal,MK_NULL, FnVal, isTruthy } from "../values.ts";

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
    while (isTruthy(evaluate(loop.loop_condition, env)))
        execute_stmt_body(loop.body, env);
    
    return MK_NULL();
}