import * as tl from "azure-pipelines-task-lib/task";
const rga = require("random-gif-api");

export async function getGif(): Promise<string> {
    return await rga.bite();
}

export async function getVariable(piplineVariable?: string, environmentVariable?: string, localEnvironmentVariable?: string) {

    const varFromPipelineTaskParameters 
        = piplineVariable != undefined 
            ? tl.getInput(piplineVariable) 
            : undefined;

    const varFromPipelineEnvironmentVariable 
        = environmentVariable != undefined 
            ? process.env[environmentVariable] 
            : undefined;

    const varFromLocalEnvironmentVariable 
        = localEnvironmentVariable != undefined 
            ? process.env[localEnvironmentVariable] 
            : undefined;

    const variable = varFromPipelineTaskParameters ?? varFromPipelineEnvironmentVariable ?? varFromLocalEnvironmentVariable;
                
    if (variable == undefined) throw new Error(
        `Could not resolve variable [${piplineVariable}]:`
            + `\n\t[${piplineVariable}]: '${varFromPipelineTaskParameters}'`
            + `\n\t[${environmentVariable}]: '${varFromPipelineEnvironmentVariable}'`
            + `\n\t[${localEnvironmentVariable}]: '${varFromLocalEnvironmentVariable}'`);
    
    console.log(`Found variable: ${piplineVariable ?? environmentVariable ?? localEnvironmentVariable} : ${variable}`)

    return variable;
}