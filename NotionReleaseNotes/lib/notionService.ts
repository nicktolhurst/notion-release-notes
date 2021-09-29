import { Client, APIErrorCode, ClientErrorCode, isNotionClientError } from "@notionhq/client";
import { PullRequest } from "./azureDevOpsService"
import * as utils from "../utils/common";
import * as block from "../utils/blockHelpers";

import tl = require("azure-pipelines-task-lib/task");
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";

require('polyfill-object.fromentries');

export async function getClient(notionToken: string): Promise<Client> {
    return new Promise<Client>(async (resolve, reject) => {
        resolve(new Client({
            auth: process.env.NOTION_TOKEN ?? notionToken,
        }));
    }).catch((err)=>{
        throw new Error(err);
    });
}

export async function updateReleaseDatabase(
    notionClient: Client,
    databaseId: string,
    releaseNotes: {},
    pullRequest: PullRequest): Promise<number> {

    return new Promise<number>(async (resolve, reject) => {

        try {
            // Create the enetry in the database (Notion Table).
            const createEntryResult: CreatePageResponse = await notionClient.pages.create({
                parent: { database_id: databaseId },
                properties: releaseNotes
            }).catch((err) => {
                tl.setResult(tl.TaskResult.Failed, err.message);
                reject(err);
            }) as CreatePageResponse;

            await notionClient.blocks.children.append({
                block_id: createEntryResult.id,
                children: [
                    // Page Title
                    await block.heading_1(pullRequest.title!, pullRequest.uri!),

                    // Reviewers Section
                    await block.heading_3("Reviewers"),
                    await block.bullet_list(pullRequest.reviewers?.map(x => x.name!)!),

                    // Commits Section - use spread operator for conditional objects.
                    ...(pullRequest.commits != undefined 
                        ? await block.heading_3("Commits") 
                        : []),
                    ...(pullRequest.commits != undefined 
                        ? await block.bullet_list(pullRequest.commits?.map(x => `${x.id} -- ${x.comment}`)!) 
                        : []),

                    // Commits Section
                    await block.heading_3("Random GIF!"),
                    await block.external_image(await utils.getGif()),
                ]
            }).catch((err) => {
                tl.setResult(tl.TaskResult.Failed, err.message);
                reject(err);
            });

            console.log(`Relase Notes: ${createEntryResult.url}`);

            resolve(0);

        } catch (err: unknown) {

            // Handle errors and reject.
            if (isNotionClientError(err)) {
                // error is now strongly typed to NotionClientError
                switch (err.code) {
                    case ClientErrorCode.RequestTimeout:
                        tl.setResult(tl.TaskResult.Failed, err.message);
                        break
                    case APIErrorCode.ObjectNotFound:
                        tl.setResult(tl.TaskResult.Failed, err.message);
                        break
                    case APIErrorCode.Unauthorized:
                        tl.setResult(tl.TaskResult.Failed, err.message);
                        break
                    default:
                        tl.setResult(tl.TaskResult.Failed, err.message);
                }
            }
            reject(err);
        };
    });
}


export function getReleaseNotesDatabaseProperties(releaseDate: string, projectName: string, buildId: string, buildUrl: string, pullrequest: PullRequest) {
    return {
        "Date": {
            date: {
                start: releaseDate
            }
        },
        "Project": {
            select: {
                name: projectName
            }
        },
        "Version": {
            rich_text: [
                {
                    text: {
                        content: buildId,
                        link: {
                            url: buildUrl
                        }
                    }
                }
            ]
        },
        "Name": {
            title: [{ text: { content: pullrequest.title! } }],
        },
        "PR Url": {
            url: pullrequest.uri!
        },
        "Owner": {
            email: pullrequest.owner!.email!
        }
    }
}
