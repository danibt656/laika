import Environment from "./environment.ts";
import { MK_NATIVE_FN, RuntimeVal, NumberVal, BooleanVal, NullVal, MK_NULL, MK_NUMBER, StringVal } from "./values.ts";

/**
 * Establishes all language-native functions
 * @param glob_env Global environment scope
 */
export function define_native_functions(glob_env: Environment): void {
    glob_env.declareVar("println", MK_NATIVE_FN(_print), true);
    glob_env.declareVar("time", MK_NATIVE_FN(_time), true);
}

/**
 * Basic print-line function
 *  Each argument sepparated by commas will be printed with a space in between,
 *  ending in a newline \n character
 * 
 * @param _args The arguments to println
 * @param _scope The scope environment
 * @returns Null runtime value
 */
function _print(_args: RuntimeVal[], _scope: Environment): RuntimeVal {
    let output = "";
    for (const arg of _args) {
        if (output.length > 0)
            output += " ";

        switch (arg.type) {
            case "number":
                output += (arg as NumberVal).value; break;
            case "boolean":
                output += (arg as BooleanVal).value; break;
            case "null":
                output += (arg as NullVal).value; break;
            case "string":
                output += (arg as StringVal).value; break;

            default:
                output += arg; break;
        }
    }
    console.log(output);
    return MK_NULL();
}

/**
 * Gives current time in UNIX format
 * @param _args None
 * @param _scope The scope environment
 * @returns A number type with UNIX timestamp
 */
function _time(_args: RuntimeVal[], _scope: Environment): RuntimeVal {
    return MK_NUMBER(Date.now());
}
