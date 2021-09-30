// import { WebApi, getPersonalAccessTokenHandler } from "azure-devops-node-api";
// import { GitCommitRef, GitPullRequest, GitCommitChanges } from "azure-devops-node-api/interfaces/GitInterfaces";
// import { getVariable } from "../utils/common";
// import { nameof } from "ts-simple-nameof"
// import { ReleaseNotes } from "./interfaces";
// import { AdoOutput } from "./adoService";


// export class Mapper {
//     #client: WebApi | undefined;
//     #gitApi: any | undefined;
//     #pullrequestId: number;
//     #repositoryId: string;
//     #orgUrl: string;
//     #adoToken: string;

//     constructor() {
//         this.#pullrequestId = parseInt(getVariable(undefined, "SYSTEM_PULLREQUEST_PULLREQUESTID"))
//         this.#repositoryId = getVariable(undefined, "BUILD_REPOSITORY_NAME");
//         this.#orgUrl = getVariable(undefined, "SYSTEM_COLLECTIONURI", "AZURE_DEVOPS_URI");
//         this.#adoToken = getVariable(undefined, "SYSTEM_ACCESSTOKEN", "AZURE_PERSONAL_ACCESS_TOKEN");
//     }

//     async map<TSource, TDest>(obj?: TSource): Promise<TDest> {
//         const typeName: string = nameof<TSource>(x => x);

//         try {
//             return new Promise<TDest>(async (resolve) => {
//                 switch (typeName) {
//                     case nameof<GitPullRequest>(x_1 => x_1):


//                         break;
//                 }
//             });
//         } catch (err: any) {
//             throw new Error(`Could not resolve '${typeName}' from the Azure DevOps API. Error message: ${err.message}`);
//         }
//     };


//     async mapAdoToDomainModel(adoOutput: AdoOutput): Promise<ReleaseNotes> 
// }

