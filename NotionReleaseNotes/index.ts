import * as notion from "./lib/notionService";
import * as ado from "./lib/azureDevOpsService";
import * as utils from "./utils/common";
import * as tl from "azure-pipelines-task-lib/task";
import { utimesSync } from "fs";
require('polyfill-object.fromentries');

async function run(): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            // Create a Notion API Client
            const notionToken = await utils.getVariable("notionToken","NOTION_API_TOKEN");
            const notionClient = await notion.getClient(notionToken);

            // Create an Azure DevOps API Client
            const adoToken = await utils.getVariable("adoToken","SYSTEM_ACCESSTOKEN","AZURE_PERSONAL_ACCESS_TOKEN");
            const orgUrl = await utils.getVariable("adoOrgUrl","SYSTEM_COLLECTIONURI","AZURE_DEVOPS_URI");
            const adoClient = await ado.getClient(adoToken, orgUrl);
            
            // Get Git information from Azure DevOps.
            const pullRequest = await ado.getPullRequest(adoClient);

            // Create Release Notes Model
            const releaseNotes = notion.getReleaseNotesDatabaseProperties(
                new Date().toISOString(),
                await utils.getVariable("projectName","SYSTEM_TEAMPROJECT"),
                await utils.getVariable("buildId","BUILD_BUILDID"),
                await utils.getVariable("buildUrl","SYSTEM_TEAMFOUNDATIONSERVERURI"),
                pullRequest,
                pullRequest.title,
                pullRequest.uri,
                pullRequest.owner?.name,
            );

            // Update Release Notes
            const databaseId = await utils.getVariable("databaseId", "NOTION_DB_ID");
            await notion.updateReleaseDatabase(notionClient, databaseId, releaseNotes, pullRequest).then((result) => {
                console.log("Completed task: 'addReleaseNotes'.");
                resolve(result);
            }).catch((err: any) => {
                tl.setResult(tl.TaskResult.Failed, err.message);
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