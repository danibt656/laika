import {
    AssignmentExpr, BinaryExpr,CallExpr,
    Identifier, ObjectLiteral, IfStmt,
    LogicalExpr,
    UnaryExpr,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate, execute_stmt_body } from "../interpreter.ts";
import {
    NumberVal,RuntimeVal,MK_NULL, ObjectVal,
    NativeFnVal, FnVal, isTruthy, BooleanVal, StringVal
} from "../values.ts";

export function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, operator: string): NumberVal {
    let result = 0;

    if (operator == "+") {
        result = lhs.value + rhs.value;
    } else if (operator == "-") {
        result = lhs.value - rhs.value;
    } else if (operator == "*") {
        result = lhs.value * rhs.value;
    } else if (operator == "/") {
        if (rhs.value === 0) {
            throw "Runtime error: Division by zero.";
        }
        result = lhs.value / rhs.value;
    } else if (operator == "%") {
        result = lhs.value % rhs.value;
    } else {
        throw `Unsupported arithmetic operator: ${operator}`;
    }

    return { type: "number", value: result } as NumberVal;
}

export function eval_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);

    if (lhs.type == "number" && rhs.type == "number") {
        return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator);
    }

    return MK_NULL();
}

export function eval_unary_expr(unop: UnaryExpr, env: Environment): RuntimeVal {
    switch (unop.operator) {
        case "!": {
            const result = !isTruthy(evaluate(unop.right, env));
            return { type: "boolean", value: result } as BooleanVal;
        }
        case "++": {
            const right = evaluate(unop.right, env);
            if (right.type != "number")
                throw `Cannot apply unary operator ${unop.operator} to object of type ${right.type}`;
            const result = (right as NumberVal);
            result.value += 1;
            return result;
        }
        case "--": {
            const right = evaluate(unop.right, env);
            if (right.type != "number")
                throw `Cannot apply unary operator ${unop.operator} to object of type ${right.type}`;
                const result = (right as NumberVal);
                result.value -= 1;
                return result;
        }
        default:
            throw `Unexpected unary operator: ${unop.operator}`;
    }

    
}

export function eval_logical_expr(logop: LogicalExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(logop.left, env);
    const operator = logop.operator;
    const rhs = evaluate(logop.right, env);
    let result = false;

    if (operator == "and") {
        result = isTruthy(lhs) && isTruthy(rhs);
    } else if (operator == "or") {
        result = isTruthy(lhs) || isTruthy(rhs);
    } else if (operator == ">" && lhs.type == "number" && rhs.type == "number") {
        result = (lhs as NumberVal).value > (rhs as NumberVal).value;
    } else if (operator == ">=" && lhs.type == "number" && rhs.type == "number") {
        result = (lhs as NumberVal).value >= (rhs as NumberVal).value;
    } else if (operator == "<" && lhs.type == "number" && rhs.type == "number") {
        result = (lhs as NumberVal).value < (rhs as NumberVal).value;
    } else if (operator == "<=" && lhs.type == "number" && rhs.type == "number") {
        result = (lhs as NumberVal).value <= (rhs as NumberVal).value;
    } else if (operator == "==" && lhs.type == "number" && rhs.type == "number") {
        result = (lhs as NumberVal).value == (rhs as NumberVal).value;
    } else if (operator == "==" && lhs.type == "string" && rhs.type == "string") {
        result = (lhs as StringVal).value == (rhs as StringVal).value;
    } else if (operator == "!=" && lhs.type == "number" && rhs.type == "number") {
        result = (lhs as NumberVal).value != (rhs as NumberVal).value;
    } else if (operator == "!=" && lhs.type == "string" && rhs.type == "string") {
        result = (lhs as StringVal).value != (rhs as StringVal).value;
    } else {
        throw `Unsupported operation: ${operator} between types '${lhs.type}' and '${rhs.type}'.`;
    }

    return { type: "boolean", value: result } as BooleanVal;
}

export function eval_identifier(ident: Identifier, env: Environment): RuntimeVal {
    return env.lookupVar(ident.symbol);
}

export function eval_assignment_expr(expr: AssignmentExpr, env: Environment): RuntimeVal {
    if (expr.assignee.kind !== "Identifier")
        throw `Cannot assign value to element of kind ${JSON.stringify(expr.assignee.kind)}`;

    const varname = (expr.assignee as Identifier).symbol;
    return env.assignVar(varname, evaluate(expr.value, env));
}

export function eval_object_expr(obj: ObjectLiteral, env: Environment): RuntimeVal {
    const object = { type: "object", properties: new Map() } as ObjectVal;

    for (const {key, value} of obj.properties) {
        const runtimeVal = (value === undefined)
            ? env.lookupVar(key)
            : evaluate(value, env);
        object.properties.set(key, runtimeVal);
    }

    return object;
}

export function eval_call_expr(call: CallExpr, env: Environment): RuntimeVal {
    const args = call.args.map((arg) => evaluate(arg, env));
    const fn = evaluate(call.caller, env);

    if (fn.type == "native-fn") {
        const result = (fn as NativeFnVal).call(args, env);
        return result;
    }
    
    if (fn.type == "function") {
        const func = fn as FnVal;
        const scope = new Environment(func.declarationEnv);

        // Create the variables for the parameter list
        for (let i = 0; i < func.parameters.length; i++) {
            // TODO check bounds here, verify arity of function
            const varname = func.parameters[i];
            scope.declareVar(varname, args[i], false);
        }

        // Evaluate function body line by line
        return execute_stmt_body(func.body, scope);
    }

    throw `Cannot call value that is not a function: ${JSON.stringify(fn)}`
}

export function eval_if_else(stmt: IfStmt, env: Environment): RuntimeVal {
    if (isTruthy(evaluate(stmt.if_condition, env)))
        return execute_stmt_body(stmt.then_branch, env);
    else if (stmt.else_branch)
        return execute_stmt_body(stmt.else_branch, env);
    
    return MK_NULL();
}