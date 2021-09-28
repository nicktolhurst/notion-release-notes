import { addReleaseNotes } from "./notionService";
import tl = require("azure-pipelines-task-lib/task");
require('polyfill-object.fromentries');

async function run(): Promise<number>  {
    return new Promise<number>(async (resolve, reject) => {
        try {
            // Notion client configuration.
            const databaseId = tl.getInput("databaseId") ?? process.env.NOTION_DB_ID;
            const notionToken = tl.getInput("notionToken") ?? process.env.NOTION_API_TOKEN;

            if (databaseId == undefined){
                reject("The variable 'databaseId' was null. If running locally please set the NOTION_DB_ID environment variable.")
                return resolve(1);
            }

            if (notionToken == undefined){
                reject("The variable 'notionToken' was null. If running locally please set the NOTION_API_TOKEN environment variable.")
                return resolve(1);
            }

            // Get release notes from task inputs. 
            const releaseNotes = {
                releaseDate: tl.getInput("releaseDate") ?? new Date().toISOString(),
                projectName: tl.getInput("projectName") ?? "test",
                buildId: tl.getInput("buildId") ?? "test",
                buildUrl: tl.getInput("buildUrl") ?? "http://test.com",
                prName: tl.getInput("prName") ?? "test",
                prUrl: tl.getInput("prUrl") ?? "http://test.com",
                ownerEmail: tl.getInput("ownerEmail") ?? "nick@example.com",
                releaseNotesUrl: tl.getInput("releaseNotesUrl") ?? "http://test.com",
            }

            // Add release notes.
            await addReleaseNotes(databaseId, notionToken, releaseNotes).then((result) => {
                resolve (result);
            }).catch((err) => {
                reject(err);
            });

        } catch (err) {

            // TODO: Log errors to agent
            // agentApi.logError(err);
            reject(err);
        }
        return resolve (0);
    });
}

run();