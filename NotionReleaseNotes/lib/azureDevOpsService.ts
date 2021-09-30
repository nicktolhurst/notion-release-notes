import * as azdev from "azure-devops-node-api";
import { GitCommitRef, GitPullRequest } from "azure-devops-node-api/interfaces/GitInterfaces";
import * as utils from "../utils/common";

require('polyfill-object.fromentries');

import tl = require("azure-pipelines-task-lib/task");
import { cp } from "fs";
import { VersionControlChangeType } from "azure-devops-node-api/interfaces/TfvcInterfaces";

export async function getClient(): Promise<azdev.WebApi> {
    return new Promise<azdev.WebApi>(async (resolve) => {
        const adoToken = await utils.getVariable(undefined, "SYSTEM_ACCESSTOKEN", "AZURE_PERSONAL_ACCESS_TOKEN");
        const orgUrl = await utils.getVariable(undefined, "SYSTEM_COLLECTIONURI", "AZURE_DEVOPS_URI");

        const client = new azdev.WebApi(orgUrl, azdev.getPersonalAccessTokenHandler(adoToken));

        resolve(client);
    }).catch((err) => {
        throw new Error("Error creating Azure DevOps Client. Error Message: " + err.message);
    });
}

export async function getPullRequest(client: azdev.WebApi): Promise<PullRequest> {
    return new Promise<PullRequest>(async (resolve, reject) => {
        try {
            const gitApi = await client.getGitApi();
            const pullRequestId = parseInt(await utils.getVariable(undefined, "SYSTEM_PULLREQUEST_PULLREQUESTID"));
            const pullRequest = await gitApi.getPullRequestById(pullRequestId);
            const reviewers = getReviewers(pullRequest);
            const commits = await getCommits(client, pullRequest);

            resolve({
                title: pullRequest.title,
                description: pullRequest.description,
                reviewers: reviewers,
                commits: commits,
                labels: pullRequest.labels?.map(label => label.name!),
                branchName: pullRequest.sourceRefName,
                owner: {
                    name: pullRequest.createdBy?.displayName,
                    email: pullRequest.createdBy?.uniqueName,
                },
                uri: pullRequest.url
            });
        } catch (err) {
            reject(err);
        }
    }).catch(err => {
        throw new Error("Could not get pull requests. Error message: " + err.message)
    });
}

function getReviewers(pullRequest: GitPullRequest): Reviewer[] | undefined {
    const reviewers = pullRequest.reviewers;

    if (reviewers == undefined) {
        tl.logIssue(tl.IssueType.Warning, "Could not find any reviewers on this PR! *gasp*")
    };

    return reviewers?.map(function (obj) {
        return {
            name: obj.displayName,
            email: obj.uniqueName,
            isRequired: obj.isRequired
        }
    });
}

async function getCommits(client: azdev.WebApi, pullRequest: GitPullRequest): Promise<Commit[]> {
    return new Promise<Commit[]>(async (resolve, reject) => {
        try {
            const api = await client.getGitApi();

            const commits = await api.getPullRequestCommits(pullRequest.repository?.id!, pullRequest.pullRequestId!);

            if (commits == undefined) {
                tl.logIssue(tl.IssueType.Warning, "Could not find any commits on this PR! *gasp*")
            };

            var object = Promise.all(commits?.map(async function (obj) {
                return {
                    id: obj.commitId,
                    comment: obj.comment,
                    committer: {
                        name: obj.committer?.name,
                        email: obj.committer?.email,
                    },
                    changes: await getChanges(client, obj, pullRequest.repository?.id!)
                }
            }));

            resolve(object);

        } catch (err) {
            reject(err);
        }

    }).catch(err => {
        throw new Error("Could not get commits. Error message: " + err.message)
    });
}

async function getChanges(client: azdev.WebApi, commit: GitCommitRef, repositoryId: string): Promise<ChangedFile[]> {
    return new Promise<ChangedFile[]>(async (resolve, reject) => {
        try {
            const api = await client.getGitApi();

            const changes = (await api.getChanges(commit.commitId!, repositoryId)).changes;

            resolve(changes!.map(function (obj) {
                return {
                    path: obj.item?.path!,
                    url: obj.item?.url!,
                    type: obj.changeType!,
                    isFolder: obj.item?.isFolder!
                }
            }));

        } catch (err) {
            reject(err);
        }

    }).catch(err => {
        throw new Error("Could not get changes. Error message: " + err.message)
    });
}

export interface Reviewer {
    name?: string,
    email?: string,
    isRequired?: boolean
}

export interface Owner {
    name?: string,
    email?: string,
}

export interface Committer {
    name?: string,
    email?: string,
}

export interface Commit {
    id: string | undefined,
    comment: string | undefined,
    committer?: Committer,
    changes: ChangedFile[]
}

export interface ChangedFile {
    path: string,
    url: string,
    type: VersionControlChangeType,
    isFolder: boolean
}

export interface ReleaseNotes {
    pullRequests: {
        id?: number,
        uri?: string,
        title?: string,
        reviewers?: Reviewer[],
        createdBy?: Owner,
    },
    commits: Commit[] | undefined
}

export interface PullRequest {
    title?: string,
    description?: string,
    reviewers?: Reviewer[],
    commits?: Commit[],
    labels?: string[] | undefined,
    branchName?: string,
    owner?: Owner,
    uri?: string,
}
