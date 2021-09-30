import { VersionControlChangeType } from "azure-devops-node-api/interfaces/TfvcInterfaces";

export interface ReleaseNotes {
    summary?: ReleaseNotesSummary,
    pullRequest?: PullRequest,
}

export interface ReleaseNotesSummary {
    date?: string,
    project?: Project,
    owner?: Owner,
    buildId?: string
}

export interface PullRequest {
    title?: PullRequestTitle,
    description?: PullRequestDescription,
    reviewers?: PullRequestReviewer[],
    commits: PullRequestCommit[],
    labels?: PullRequestLabel[],
    branchName?: PullRequestSourceBranchName,
    creator?: PullRequestCreator,
    uri?: PullRequestUrl,
}

interface PullRequestTitle {
    text?: string,
}

interface PullRequestDescription {
    text?: string,
}

interface PullRequestReviewer {
    name?: string,
    email?: string,
    isRequired?: boolean,
}

interface PullRequestCommit {
    id?: string,
    sha?: string,
    comment?: string,
    author?: CommitAuthor,
    committer?: Committer,
    changes?: CommitFileChange[]
}

interface PullRequestLabel {
    text?: string,
}

interface PullRequestSourceBranchName {
    text?: string,
}

interface PullRequestCreator {
    name?: string,
    email?: string,
}

interface PullRequestUrl {
    text?: string,
}

interface Project {
    name?: string,
    url?: string,
}

interface Owner {
    name?: string,
    email?: string,
}

interface CommitAuthor {
    name?: string,
    email?: string,
}

interface Committer {
    name?: string,
    email?: string,
}

export interface CommitFileChange {
    path?: string,
    url?: string,
    type?: VersionControlChangeType,
    isFolder?: boolean,
}
