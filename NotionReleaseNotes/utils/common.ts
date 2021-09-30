import * as tl from "azure-pipelines-task-lib/task";

export async function getGif(): Promise<string> {
    var giphy = require('giphy-api')('x8Y3tV1x3iIBC3DKhtW2VWYyfhznRQc6');

    return new Promise<string>(async (resolve) => {
        const result = await giphy.random({
            tag: 'funny',
            rating: 'g',
            fmt: 'gif'
        });

        resolve(result.data.image_original_url);
    }).catch((err) => {
        throw new Error("Unable to get gif :(");
    })
}

export function getVariable(piplineVariable?: string, environmentVariable?: string, localEnvironmentVariable?: string) {

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
