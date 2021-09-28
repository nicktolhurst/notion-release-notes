import { Client, APIErrorCode, ClientErrorCode, isNotionClientError } from "@notionhq/client";
require('polyfill-object.fromentries');

export async function addReleaseNotes(
    databaseId: string,
    notionToken: string,
    releaseNotes: {
        releaseDate: string,
        projectName: string,
        buildId: string,
        buildUrl: string,
        prName: string,
        prUrl: string,
        ownerEmail: string,
        releaseNotesUrl: string
    }): Promise<number> {

    return new Promise<number>(async (resolve, reject) => {

        // Create the notion API Client.
        const notion = new Client({
            auth: process.env.NOTION_TOKEN ?? notionToken,
        })

        try {

            // Create the enetry in the database (Notion Table).
            await notion.pages.create({
                parent: { database_id: databaseId },
                properties: getReleaseNotesProperties(releaseNotes)
            }).catch((err)=>{
                reject(err);
            });

            resolve(0);

        } catch (error: unknown) {

            // Handle errors and reject.
            if (isNotionClientError(error)) {
                // error is now strongly typed to NotionClientError
                switch (error.code) {
                    case ClientErrorCode.RequestTimeout:
                        console.log("ClientErrorCode.RequestTimeout");
                        console.log(error);
                        break
                    case APIErrorCode.ObjectNotFound:
                        console.log("APIErrorCode.ObjectNotFound");
                        console.log(error);
                        break
                    case APIErrorCode.Unauthorized:
                        console.log("APIErrorCode.Unauthorized");
                        console.log(error);
                        break
                    default:
                    console.log(error);
                }
            }
            reject(error);
        };
    });
}


export function getReleaseNotesProperties(issue: { releaseDate: string, projectName: string, buildId: string, buildUrl: string, prName: string, prUrl: string, ownerEmail: string, releaseNotesUrl: string }) {
    const { releaseDate, projectName, buildId, buildUrl, prName, prUrl, ownerEmail, releaseNotesUrl } = issue
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
            title: [{ text: { content: prName } }],
        },
        "PR Url": {
            url: prUrl
        },
        "Owner": {
            email: ownerEmail
        },
        "Release Notes": {
            files: [
                {
                    name: "Release Notes",
                    external: {
                        url: releaseNotesUrl
                    }
                }
            ]
        },
    }
}
