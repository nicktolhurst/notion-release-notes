import * as azdev from "azure-devops-node-api";
import { GitCommitRef, GitPullRequest } from "azure-devops-node-api/interfaces/GitInterfaces";
import * as utils from "../utils/common";

require('polyfill-object.fromentries');

import tl = require("azure-pipelines-task-lib/task");

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
    committer?: Committer
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
    title?: string
    reviewers?: Reviewer[]
    commits?: Commit[],
    owner?: Owner,
    uri?: string,
}

export async function getClient(adoToken: string, orgUrl: string): Promise<azdev.WebApi> {
    return new Promise<azdev.WebApi>(async (resolve, reject) => {
        resolve(new azdev.WebApi(orgUrl, azdev.getPersonalAccessTokenHandler(adoToken)));
    }).catch((err)=>{
        throw new Error(err);
    });
}

export async function getPullRequest(client: azdev.WebApi) : Promise<PullRequest> {
    return new Promise<PullRequest>(async (resolve, reject) => {
        console.log("Finding PR...");
        const gitApi = await client.getGitApi();
        const pullRequestId = parseInt(await utils.getVariable(undefined, "SYSTEM_PULLREQUEST_PULLREQUESTID"));
        const pullRequest = await gitApi.getPullRequestById(pullRequestId);
        console.log(`> Found PR: '${pullRequest.title}'`);
        resolve({
            title: pullRequest.title,
            reviewers: getReviewers(pullRequest),
            commits: getCommits(pullRequest),
            owner: {
                name:  pullRequest.createdBy?.displayName,
                email: pullRequest.createdBy?.uniqueName,
            },
            uri: pullRequest.remoteUrl
        });
    });
}

function getReviewers(pullRequest: GitPullRequest) : Reviewer[] | undefined {
    const reviewers = pullRequest.reviewers;

    if(reviewers == undefined)
    {
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

function getCommits(pullRequest: GitPullRequest) : Commit[] | undefined {
    const commits = pullRequest.commits;

    if(commits == undefined)
    {
        tl.logIssue(tl.IssueType.Warning, "Could not find any commits on this PR! *gasp*")
    };

    return commits?.map(function (obj) {
        return {
            id: obj.commitId,
            comment: obj.comment,
            committer: {
                name: obj.committer?.name,
                email: obj.committer?.email,
            },
        }
    });
}














































export async function getReleaseNotes(adClient: azdev.WebApi, projectName: string, repositoryId: string, pullRequestId: number): Promise<ReleaseNotes> {
    return new Promise<ReleaseNotes>(async (resolve, reject) => {
        console.log("Starting task: 'getReleaseNotes'.");

        try {
            const gitApi = await adClient.getGitApi();

            const commits = await gitApi.getPullRequestCommits(repositoryId, pullRequestId, projectName)

            const pullRequest = await gitApi.getPullRequestById(pullRequestId);

            const releaseNotes = formatReleaseNotes(commits, pullRequest);

            resolve(releaseNotes);

            console.log("Completed task: 'getReleaseNotes'.");
        } catch (err) {

            reject(err);
        };
    }).catch((err) => {
        tl.setResult(tl.TaskResult.Failed, err.message);
        throw new Error();
    });
}


function formatReleaseNotes(commits: GitCommitRef[], pullRequest: GitPullRequest) : ReleaseNotes {
    return {
        pullRequests: {
            id: pullRequest.pullRequestId,
            uri: pullRequest.url,
            title: pullRequest.title,
            reviewers: pullRequest.reviewers?.map(function (obj) {
                return {
                    name: obj.displayName,
                    email: obj.uniqueName,
                }
            }),
            createdBy: {
                name: pullRequest.createdBy?.displayName,
                email: pullRequest.createdBy?.uniqueName,
            }
        },
        commits: commits.map(function (obj) {
            return {
                id: obj.commitId,
                comment: obj.comment
            }
        })
    }
}

