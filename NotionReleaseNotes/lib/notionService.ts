import { Client } from "@notionhq/client";
import { ReleaseNotes } from "./interfaces";
import { getVariable, getGif } from "../utils/common";
import { heading_1, heading_3, external_image, bullet_list, paragraph } from "../utils/blockHelpers";
import { AppendBlockChildrenResponse, CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
import * as tl from "azure-pipelines-task-lib/task";

require('polyfill-object.fromentries');

export class NotionService {

    #notionToken: string;
    #client: Client | undefined;
    #db: string | undefined;

    constructor() {
        this.#notionToken = getVariable("notionToken", "NOTION_API_TOKEN");
        this.#db = getVariable("databaseId", "NOTION_DB_ID");
    }

    async pushReleaseNotes(releaseNotesDomainModel: ReleaseNotes): Promise<CreatePageResponse> {
        tl.debug("Starting - [NotionService.pushReleaseNotes]");

        if (this.#client == undefined) throw new Error("The Notion client has not yet being initialized. Please call 'initialize()' first.")

        return new Promise<CreatePageResponse>(async (resolve, reject) => {
            try {
                const date: string = releaseNotesDomainModel.summary?.date!
                const projectName: string = releaseNotesDomainModel.summary?.project?.name!
                const version: string = releaseNotesDomainModel.summary?.buildId!
                const prName: string = releaseNotesDomainModel.pullRequest?.title?.text!
                const prUrl: string = releaseNotesDomainModel.pullRequest?.uri?.text!
                const ownerEmail: string = releaseNotesDomainModel.pullRequest?.creator?.email!

                const createEntryResult: CreatePageResponse = await this.#client!.pages.create({
                    parent: { database_id: this.#db! },
                    properties: {
                        "Date": {
                            date: {
                                start: date
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
                                        content: version
                                    },
                                    annotations: {
                                        code: true,
                                    }
                                }
                            ]
                        },
                        "Name": {
                            title: [{ text: { content: prName, link: { url: prUrl } } }],
                        },
                        "Owner": {
                            email: ownerEmail
                        }
                    }
                }) as CreatePageResponse;

                tl.debug("Finished - [NotionService.pushReleaseNotes]");
                resolve(createEntryResult);
            } catch (err: any) {
                reject(err.message);
            }
        });
    };

    async setReleaseNotesContent(createEntryResult: CreatePageResponse, releaseNotesDomainModel: ReleaseNotes): Promise<AppendBlockChildrenResponse> {
        tl.debug("Starting - [NotionService.setReleaseNotesContent]");

        if (this.#client == undefined) throw new Error("The Notion client has not yet being initialized. Please call 'initialize()' first.")

        return new Promise<AppendBlockChildrenResponse>(async (resolve, reject) => {
            try {
                const mainHeading = await heading_1(releaseNotesDomainModel.pullRequest?.title?.text!, releaseNotesDomainModel.pullRequest?.uri?.text!);
                const description = await paragraph(releaseNotesDomainModel.pullRequest?.description?.text!);
                const reviewersHeading = await heading_3("Reviewers");
                const reviewersList = await bullet_list(releaseNotesDomainModel.pullRequest?.reviewers?.map(c => c.name!)!);
                const commitsHeading = await heading_3("Commits");
                const commitsList = await bullet_list(releaseNotesDomainModel.pullRequest?.commits?.map(c => `${c.sha} -- ${c.comment}`)!);

                const appendBlockChildrenResponse = await this.#client!.blocks.children.append({
                    block_id: createEntryResult.id,
                    children: [
                        ...mainHeading,
                        ...description,
                        ...reviewersHeading,
                        ...reviewersList,
                        ...commitsHeading,
                        ...commitsList,
                    ]
                });

                tl.debug("Finished - [NotionService.setReleaseNotesContent]");
                resolve(appendBlockChildrenResponse);
            } catch (err: any) {
                reject(err.message);
            }
        });
    };

    async initialize(notionToken?: string, notionDb?: string): Promise<NotionService> {
        return new Promise<NotionService>(async (resolve) => {
            this.#client = new Client({ auth: notionToken ?? this.#notionToken });
            this.#db = notionDb ?? this.#db;
            resolve(this);
        }).catch((err) => {
            throw new Error("Error creating Notion Client. Error Message: " + err.message);
        });
    }
}
