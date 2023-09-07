import { Stmt } from "../frontend/ast.ts";
import Environment from "./environment.ts";

export type ValueType =
    // Data Types
    | "null"
    | "number"
    | "string"
    | "boolean"

    // Breakpoints
    | "loop-bp"
    | "return"

    // Structures
    | "object"
    | "native-fn"
    | "function"
    | "if-else"
    ;
    
export interface RuntimeVal {
    type: ValueType;
}

export interface NullVal extends RuntimeVal {
    type: "null";
    value: null;
}

export interface NumberVal extends RuntimeVal {
    type: "number";
    value: number;
}

export interface StringVal extends RuntimeVal {
    type: "string";
    value: string;
}

export interface BooleanVal extends RuntimeVal {
    type: "boolean";
    value: boolean;
}

export interface LoopBreakpoint extends RuntimeVal {
    type: "loop-bp";
    value: string;
}

export interface ReturnVal extends RuntimeVal {
    type: "return";
    value: RuntimeVal;
}

/**
 * Gives the logical value associated with a data type runtime value
 * @param val The runtime value
 * @returns True / False,
 *          depending on the logical value of the given runtime value
 */
export function isTruthy(val: RuntimeVal): boolean {
    switch (val.type) {
        case "null":
            return false;
        case "number":
            return !((val as NumberVal).value === 0.0);
        case "string":
            return !((val as StringVal).value === "");
        case "boolean":
            return (val as BooleanVal).value;
        default:
            throw `Element of type ${val.type} does not have a logical value.`
    }
}

export interface ObjectVal extends RuntimeVal {
    type: "object";
    properties: Map<string, RuntimeVal>;
}

export function MK_NUMBER(n = 0): NumberVal {
    return { type: "number", value: n } as NumberVal;
}

export function MK_NULL(): NullVal {
    return { type: "null", value: null } as NullVal;
}

export function MK_BOOL(b = true): BooleanVal {
    return { type: "boolean", value: b } as BooleanVal;
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;

export interface NativeFnVal extends RuntimeVal {
    type: "native-fn";
    call: FunctionCall;
}

export function MK_NATIVE_FN(call: FunctionCall) {
    return { type: "native-fn", call } as NativeFnVal;
}

export interface FnVal extends RuntimeVal {
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment; // Where the function is defined
    body: Stmt[];
}

export function runtime_to_str(val: RuntimeVal): string {
    switch (val.type) {
        case "null":
            // return ""+(val as NullVal).value;
            return "";
        case "number":
            return ""+(val as NumberVal).value;
        case "string":
            return ""+(val as StringVal).value;
        case "boolean":
            return ""+(val as BooleanVal).value;
        case "object":
            return JSON.stringify(Object.fromEntries((val as ObjectVal).properties));
        case "function":
            return `Function ${(val as FnVal).name}`;
        case "return":
            return runtime_to_str((val as ReturnVal).value);
        default:
            return "";
    }
}