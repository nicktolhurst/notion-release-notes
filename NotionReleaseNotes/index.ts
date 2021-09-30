import { NotionService } from "./lib/notionService"
import { GitCommitChanges, GitPullRequest, GitCommitRef } from "azure-devops-node-api/interfaces/GitInterfaces";
import { AdoObject, AdoService, AdoResponseObjectCollection } from "./lib/adoService";
import * as tl from "azure-pipelines-task-lib/task";
import { ReleaseNotes, CommitFileChange } from "./lib/interfaces";
import { resolve } from "path/posix";
require('polyfill-object.fromentries');

async function run(): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            // Create Azure DevOps Service & get all required PR data from the ADO server.
            const ado = new AdoService();
            await ado.initialize();

            const gitPullRequest = await ado.get(AdoObject.PullRequest) as GitPullRequest;
            const gitCommitRefs = await ado.get(AdoObject.CommitRefs, gitPullRequest) as GitPullRequest[];

            const adoResponseObjectCollection: AdoResponseObjectCollection = {
                gitPullRequest: gitPullRequest,
                gitCommitRefs: gitCommitRefs
            }

            console.log(adoResponseObjectCollection);

            // TODO: Implement a mapper!
            // new Mapper().map<AdoOutput, ReleaseNotes>(adoOutput);
            // Workaround for now:
            const releaseNotesDomainModel: ReleaseNotes = await mapToReleaseNotesDomainModeil(adoResponseObjectCollection, ado);

            // Create Notion API client and add release notes.
            const notion = await new NotionService().initialize();

            const createPageResponse = await notion.pushReleaseNotes(releaseNotesDomainModel);

            const appendBlockChildrenResponse = await notion.setReleaseNotesContent(createPageResponse, releaseNotesDomainModel);
        
            resolve(0);
        } catch (err: any) {
            tl.setResult(tl.TaskResult.Failed, err.message);
            reject(err);
        }
    }).catch((err) => {
        tl.setResult(tl.TaskResult.Failed, err.message);
        return 1;
    });
}

async function mapToReleaseNotesDomainModeil(adoResponseObjectCollection: AdoResponseObjectCollection, ado: AdoService): Promise<ReleaseNotes> {
    return new Promise<ReleaseNotes>(async (resolve, reject) => {
        try {
            resolve({
                summary: {
                    date: new Date().toISOString(),
                    owner: {
                        name: adoResponseObjectCollection.gitPullRequest.createdBy?.displayName,
                        email: adoResponseObjectCollection.gitPullRequest.createdBy?.uniqueName
                    },
                    project: {
                        name: adoResponseObjectCollection.gitPullRequest.repository?.project?.name,
                        url: adoResponseObjectCollection.gitPullRequest.repository?.project?.url
                    },
                    buildId: adoResponseObjectCollection.gitPullRequest.labels?.find(label => label.name?.toLowerCase().startsWith("version:"))?.name?.toLowerCase()
                },
                pullRequest: {
                    branchName: {
                        text: adoResponseObjectCollection.gitPullRequest.sourceRefName
                    },
                    commits: await Promise.all(adoResponseObjectCollection.gitCommitRefs.map(async (commitRef) => {
                        return {
                            id: commitRef.commitId,
                            sha: commitRef.commitId?.length! > 7 ? commitRef.commitId?.substr(0, 7) : commitRef.commitId,
                            comment: commitRef.comment,
                            author: {
                                name: commitRef.author?.name,
                                email: commitRef.author?.email
                            },
                            committer: {
                                name: commitRef.committer?.name,
                                email: commitRef.committer?.email
                            },
                            changes: (await ado.get(AdoObject.CommitRefs, adoResponseObjectCollection.gitPullRequest, commitRef) as GitCommitChanges).changes?.map((change): CommitFileChange => {
                                return {
                                    url: change.item?.url,
                                    isFolder: change.item?.isFolder,
                                    path: change.item?.path,
                                    type: change.changeType
                                }
                            }),
                        }
                    })),
                    title: {
                        text: adoResponseObjectCollection.gitPullRequest.title
                    },
                    creator: {
                        name: adoResponseObjectCollection.gitPullRequest.createdBy?.displayName,
                        email: adoResponseObjectCollection.gitPullRequest.createdBy?.uniqueName,
                    },
                    uri: {
                        text: adoResponseObjectCollection.gitPullRequest.url
                    },
                    description: {
                        text: adoResponseObjectCollection.gitPullRequest.description
                    },
                    labels: undefined,
                    reviewers: adoResponseObjectCollection.gitPullRequest.reviewers?.map((obj) => {
                        return {
                            email: obj.uniqueName,
                            isRequired: obj.isRequired,
                            name: obj.displayName
                        }
                    }),
                }
            });
        } catch (err: any) {
            reject(err);
        }
    }).catch((err) => {
        throw new Error("fucked it!" + err.message);
    })
}

run();