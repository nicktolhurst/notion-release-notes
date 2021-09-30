import { Client } from "@notionhq/client";
import { ReleaseNotes } from "./interfaces";
import { getVariable, getGif } from "../utils/common";
import { heading_1, heading_3, external_image, bullet_list, paragraph } from "../utils/blockHelpers";
import { AppendBlockChildrenResponse, CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
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

        if (this.#client == undefined) throw new Error("The Notion client has not yet being initialized. Please call 'initialize()' first.")

        return new Promise<CreatePageResponse>(async (resolve, reject) => {
            try {
                const createEntryResult: CreatePageResponse = await this.#client!.pages.create({
                    parent: { database_id: this.#db! },
                    properties: {
                        "Date": {
                            date: {
                                start: releaseNotesDomainModel.summary?.date!
                            }
                        },
                        "Project": {
                            select: {
                                name: releaseNotesDomainModel.summary?.project?.name!
                            }
                        },
                        "Version": {
                            rich_text: [
                                {
                                    text: {
                                        content: releaseNotesDomainModel.summary?.buildId ?? "No Build Id :("
                                    }
                                }
                            ]
                        },
                        "Name": {
                            title: [{ text: { content: releaseNotesDomainModel.pullRequest?.title?.text!, link: { url: releaseNotesDomainModel.pullRequest?.uri?.text! } } }],
                        },
                        "Owner": {
                            email: releaseNotesDomainModel.pullRequest?.creator?.email!
                        }
                    }
                }) as CreatePageResponse;

                resolve(createEntryResult);
            } catch (err: any) {
                reject(err.message);
            }
        });
    };

    async setReleaseNotesContent(createEntryResult: CreatePageResponse, releaseNotesDomainModel: ReleaseNotes): Promise<AppendBlockChildrenResponse> {

        if (this.#client == undefined) throw new Error("The Notion client has not yet being initialized. Please call 'initialize()' first.")

        return new Promise<AppendBlockChildrenResponse>(async (resolve, reject) => {
            try {

                const mainHeading = await heading_1(releaseNotesDomainModel.pullRequest?.title?.text!, releaseNotesDomainModel.pullRequest?.uri?.text!);
                const description = await paragraph(releaseNotesDomainModel.pullRequest?.description?.text!);
                const reviewersHeading = await heading_3("Reviewers");
                const reviewersList = await bullet_list(releaseNotesDomainModel.pullRequest?.reviewers?.map(c => c.name!)!);
                const commitsHeading = await heading_3("Commits");
                const commitsList = await bullet_list(releaseNotesDomainModel.pullRequest?.commits?.map(c => `${c.sha} -- ${c.comment}`)!);
                const gifHeading = await heading_3("Random GIF!");
                const gifImage = await external_image(await getGif());

                const appendBlockChildrenResponse = await this.#client!.blocks.children.append({
                    block_id: createEntryResult.id,
                    children: [
                        ...mainHeading,
                        ...description,
                        ...reviewersHeading,
                        ...reviewersList,
                        ...commitsHeading,
                        ...commitsList,
                        ...gifHeading,
                        ...gifImage,
                    ]
                });


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
