import Parser from "./frontend/parser.ts";
import { evaluate } from "./runtime/interpreter.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { runtime_to_str } from "./runtime/values.ts";

const EXTENSION = ".lai"; // Extension for LAIka files

function loop(): void {
    const parser = new Parser();
    const env = createGlobalEnv();

    console.log("LAIka v0.1 [enter '.q' for quick exit]");

    while(true) {
        const input = prompt(">>");

        if (!input)
            continue;
        if (input.includes(".q"))
            Deno.exit(0);

        try {
            const program = parser.produceAST(input);
            // console.log(program);
            const result = evaluate(program, env);
            console.log(runtime_to_str(result));
        } catch(e) {
            console.log(e);
            continue;
        }
    }
}

async function run(filename: string) {
    const parser = new Parser();
    const env = createGlobalEnv();

    try {
        const input = await Deno.readTextFile(filename);
        const program = parser.produceAST(input);
        // console.log(program);
        const result = evaluate(program, env);
        // console.log(result);
    } catch(e) {
        console.log(e);
    }
}

async function main() {
    if (Deno.args.length == 0) {
        loop();
    } else if (Deno.args.length == 1) {
        const filename = Deno.args[0];
        if (filename.endsWith(EXTENSION))
            await run(filename);
        else
            throw `Source code files must end with ${EXTENSION} extension.`;
    } else {
        throw `Multiple filenames [${Deno.args}] cannot be simultaneously interpreted.`
    }
}

main()