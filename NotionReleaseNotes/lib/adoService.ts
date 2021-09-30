import { WebApi, getPersonalAccessTokenHandler } from "azure-devops-node-api";
import { GitCommitRef, GitPullRequest, GitCommitChanges } from "azure-devops-node-api/interfaces/GitInterfaces";
import * as tl from "azure-pipelines-task-lib/task";
import { getVariable } from "../utils/common";
import { nameof } from "ts-simple-nameof"
import { reject } from "q";

export interface AdoResponseObjectCollection {
    gitPullRequest: GitPullRequest
    gitCommitRefs: GitCommitRef[],
}

export const enum AdoObject {
    PullRequest,
    CommitRefs,
    CommitChanges,
  }

export class AdoService {
    #client: WebApi | undefined;
    #gitApi: any | undefined;
    #pullrequestId: number;
    #repositoryId: string;
    #orgUrl: string;
    #adoToken: string;

    constructor() {
        this.#pullrequestId = parseInt(getVariable(undefined, "SYSTEM_PULLREQUEST_PULLREQUESTID"))
        this.#repositoryId = getVariable(undefined, "BUILD_REPOSITORY_NAME");
        this.#orgUrl = getVariable(undefined, "SYSTEM_COLLECTIONURI", "AZURE_DEVOPS_URI");
        this.#adoToken = getVariable(undefined, "SYSTEM_ACCESSTOKEN", "AZURE_PERSONAL_ACCESS_TOKEN");
    }

    async get(object: AdoObject, pullRequest?: GitPullRequest, commit?: GitCommitRef): Promise<GitCommitRef | GitPullRequest | GitCommitChanges> {

        if (this.#client == undefined) throw new Error("The ADO client has not yet being initialized. Please call 'initialize()' first.")
        if (this.#gitApi == undefined) throw new Error("The git API has not yet being initialized. Please call 'initialize()' first.")

        try {
            return new Promise<GitCommitRef | GitPullRequest | GitCommitChanges>(async (resolve) => {
                switch (object) {
                    case AdoObject.PullRequest:
                        resolve(await this.#gitApi.getPullRequestById(this.#pullrequestId));
                        break;
                    case AdoObject.CommitRefs:
                        resolve(await this.#gitApi.getPullRequestCommits(pullRequest?.repository!.id!, pullRequest?.pullRequestId!));
                        break;
                    case AdoObject.CommitChanges:
                        resolve(await this.#gitApi.getChanges(commit!.commitId!, pullRequest?.repository!.id!));
                        break;
                    default:
                        tl.setResult(tl.TaskResult.Failed, `Could not resolve '${object}' from the Azure DevOps API.`);
                        reject();
                }
            });
        } catch (err: any) {
            throw new Error(err);
        }
    };

    async initialize(orgUrl?: string, adoToken?: string): Promise<AdoService> {
        return new Promise<AdoService>(async (resolve, reject) => {
            try{
                this.#client = new WebApi(orgUrl ?? this.#orgUrl, getPersonalAccessTokenHandler(adoToken ?? this.#adoToken));
                this.#gitApi = await this.#client.getGitApi();

                resolve(this);
            } catch (err: any) {

                reject(err)
            }
        }).catch((err) => {
            throw new Error("Error creating Azure DevOps Client. Error Message: " + err.message);
        });
    }
}