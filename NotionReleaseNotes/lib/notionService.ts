import { Client, APIErrorCode, ClientErrorCode, isNotionClientError } from "@notionhq/client";
import { PullRequest } from "./azureDevOpsService"
import * as block from "../utils/blockHelpers";
import * as utils from "../utils/common";

import tl = require("azure-pipelines-task-lib/task");
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";

require('polyfill-object.fromentries');

export async function getClient(notionToken: string): Promise<Client> {
    return new Promise<Client>(async (resolve, reject) => {
        resolve(new Client({
            auth: process.env.NOTION_TOKEN ?? notionToken,
        }));
    }).catch((err) => {
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
            console.log("Created PR entry!");

            await notionClient.blocks.children.append({
                block_id: createEntryResult.id,
                children: [
                    // Page Title with URL.
                    ...[
                        await block.heading_1(pullRequest.title!, pullRequest.uri!),
                    ],

                    // List reviewers as a billet point list with a heading.
                    ...[
                        await block.heading_3("Reviewers"),
                        await block.bullet_list(pullRequest.reviewers?.map(x => x.name!)!),
                    ],

                    // Conditionally add commits if they exist!
                    ...(pullRequest.commits != undefined ? [
                            await block.heading_3("Commits"),
                            await block.bullet_list(pullRequest.commits?.map(x => `${x.id} -- ${x.comment}`)!)
                        ] : []
                    ),

                    // Add a gif! Just for fun.
                    ...[
                        await block.heading_3("Random GIF!"),
                        await block.external_image(await utils.getGif()),
                    ]
                ]
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
                        console.log("The dreaded error... ");
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
            title: [{ text: { content: pullrequest.title!, link: { url: pullrequest.uri! } } }],
        },
        "PR Url": {
            url: pullrequest.uri ?? "huh!"
        },
        "Owner": {
            email: pullrequest.owner!.name!
        }
    }
}
