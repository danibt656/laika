import Parser from "./frontend/parser.ts";
import { evaluate } from "./runtime/interpreter.ts";
import Environment, { createGlobalEnv } from "./runtime/environment.ts";

// loop();
run("./test.txt");

function loop(): void {
    const parser = new Parser();
    const env = createGlobalEnv();

    console.log("Nero v0.1");

    while(true) {
        const input = prompt("> ");

        if (!input)
            continue;
        if (input.includes(".q"))
            Deno.exit(0);

        try {
            const program = parser.produceAST(input);
            console.log(program);
    
            const result = evaluate(program, env);
            console.log(result);
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