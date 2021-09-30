import * as notion from "./lib/notionService";
import * as ado from "./lib/azureDevOpsService";
import * as utils from "./utils/common";
import * as tl from "azure-pipelines-task-lib/task";
require('polyfill-object.fromentries');

async function run(): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            // Create API clients.
            const notionClient = await notion.getClient();
            const adoClient = await ado.getClient();
            
            // Get PR pertaining to this release.
            const pullRequest = await ado.getPullRequest(adoClient);

            // Create Release Notes Model
            const releaseNotes = notion.getReleaseNotesDatabaseProperties(
                new Date().toISOString(),
                await utils.getVariable("projectName","SYSTEM_TEAMPROJECT"),
                await utils.getVariable("buildId","BUILD_BUILDID"),
                await utils.getVariable("buildUrl","SYSTEM_TEAMFOUNDATIONSERVERURI"),
                pullRequest,
            );

            // Update Release Notes
            await notion.updateReleaseDatabase(notionClient, releaseNotes, pullRequest).then((result) => {
                resolve(result);
            }).catch((err: any) => {
                reject(err);
            });

            resolve(0);
        } catch (err: any) {
            reject(err);
        }
    }).catch((err) => {
        tl.setResult(tl.TaskResult.Failed, err.message);
        return 1;
    });
}

run();