import { define_native_functions } from "./native_fns.ts";
import { MK_BOOL, MK_NULL, RuntimeVal } from "./values.ts";


export function createGlobalEnv() {
    const glob_env = new Environment();

    // Create defualt global environment
    glob_env.declareVar("true", MK_BOOL(true), true);
    glob_env.declareVar("false", MK_BOOL(false), true);
    glob_env.declareVar("null", MK_NULL(), true);

    // Define native functions
    define_native_functions(glob_env);

    return glob_env;
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeVal>;
    private constants: Set<string>;

    constructor(parentENV?: Environment) {
        this.parent = parentENV;
        this.variables = new Map();
        this.constants = new Set();
    }

    public declareVar(varname: string, value: RuntimeVal, constant: boolean): RuntimeVal {
        if (this.variables.has(varname))
            throw `Cannot declare variable '${varname}', as it already exists.`;

        this.variables.set(varname, value);

        if (constant)
            this.constants.add(varname);

        return value;
    }

    public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname);

        if (env.constants.has(varname))
            throw `Cannot reassign to constant variable '${varname}'.`

        env.variables.set(varname, value);
        return value;
    }

    public lookupVar(varname: string): RuntimeVal {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeVal;
    }

    public resolve(varname: string): Environment {
        if (this.variables.has(varname))
            return this;

        if (this.parent == undefined)
            throw `Cannot resolve '${varname}' in the current scope.`;

        return this.parent.resolve(varname);
    }
}