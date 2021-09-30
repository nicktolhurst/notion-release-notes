import { Client, APIErrorCode, ClientErrorCode, isNotionClientError } from "@notionhq/client";
import { PullRequest } from "./azureDevOpsService"
import * as block from "../utils/blockHelpers";
import * as utils from "../utils/common";

import tl = require("azure-pipelines-task-lib/task");
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";

require('polyfill-object.fromentries');

export async function getClient(): Promise<Client> {
    return new Promise<Client>(async (resolve) => {
        resolve(new Client({
            auth: await utils.getVariable("notionToken","NOTION_API_TOKEN"),
        }));
    }).catch((err) => {
        throw new Error(err);
    });
}

export async function updateReleaseDatabase(
    notionClient: Client,
    releaseNotes: {},
    pullRequest: PullRequest): Promise<number> {

    return new Promise<number>(async (resolve, reject) => {

        try {
            // Create the enetry in the database (Notion Table).
            const databaseId = await utils.getVariable("databaseId", "NOTION_DB_ID");

            const createEntryResult: CreatePageResponse = await notionClient.pages.create({
                parent: { database_id: databaseId },
                properties: releaseNotes
            }).catch((err) => {
                reject(err);
            }) as CreatePageResponse;

            const mainHeading = await block.heading_1(pullRequest.title!, pullRequest.uri!);
            const reviewersHeading = await block.heading_3("Reviewers");
            const reviewersList = await block.bullet_list(pullRequest.reviewers?.map(c => c.name!)!);
            const commitsHeading = await block.heading_3("Commits");
            const commitsList =  await block.bullet_list(pullRequest.commits?.map(c => `${c.id} -- ${c.comment}`)!);
            const gifHeading = await block.heading_3("Random GIF!");
            const gifImage = await block.external_image(await utils.getGif());

            const blockChildren = [
                ...mainHeading,
                ...reviewersHeading,
                ...reviewersList,
                ...commitsHeading,
                ...commitsList,
                ...gifHeading,
                ...gifImage
            ];

            await notionClient.blocks.children.append({
                block_id: createEntryResult.id,
                children: blockChildren
            });

            console.log(`Relase Notes: ${createEntryResult.url}`);

            resolve(0);

        } catch (err: unknown) {

            // Handle errors and reject.
            if (isNotionClientError(err)) {
                // error is now strongly typed to NotionClientError
                switch (err.code) {
                    case ClientErrorCode.RequestTimeout:
                        reject(err);
                        break
                    case APIErrorCode.ObjectNotFound:
                        reject(err);
                        break
                    case APIErrorCode.Unauthorized:
                        reject(err);
                        break
                    default:
                        reject(err);
                        console.log("The dreaded error... ");
                }
            }

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
        "Owner": {
            email: pullrequest.owner!.name!
        }
    }
}
