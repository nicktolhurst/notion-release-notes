# Contribution Guide!

## Model

* Common Interfaces
    * Date
    * Project
    * Owner
    * PR
        * Description
        * Commits
        * Changes (files changed)
        * Owner
        * Reviewers

* Notion API
    * Mapper
        * Map common interfaces to notion API models
    * Client
        * Authenticate with notion
    * Services
        * Add Release Notes entry
        * Update Release Notes Page

* ADO API
    * Mapper
        * Map ADO to common interfaces
    * Client
        * Authenticate with ADO
    * Services
        * Get PRs
        * Get Commits
        * Get Changes

* Index (Task)
    * Connect to clients
    * Get release notes
    * Create release notes




# Summary Format
The below is an example of the summary list format. This is an overview of historical releases. 
|Date|Project|Version|Owner|Pull Request|
|:-:|:-:|:-:|:-:|:-:|
|30-09-2021|Example Project|1.1.0|Nick Tolhurst|[PR: Awesome Pull Request]("http://www.google.com/")|
|22-09-2021|Example Project|1.0.1|Nick Tolhurst|[PR: Fixes Live Issue]("http://www.google.com/")|
|30-09-2021|Example Project|1.0.0|Nick Tolhurst|[PR: First Live Release!]("http://www.google.com/")|

> **Note**: This format is not customisable in version 1 of this task. A future iteration should support templating / formatting. 

# Release Notes Format
The below is an example of the release notes format. This is a more indepth documentation of the release. These release notes should be accessable via the summary table.

---
## [PR: Awesome Pull Request]("http://www.google.com/")
This is the description text for the awesome pull request. This is where engineers should write exactly what it is the pull request / release is going to achieve. List out changes and breaking changes here.
### Creator
* Nick Tolhurst
### Reviewers
* Nick Tolhurst
* Jane Doe
### Commits
* Initial Commit ([8293f3](""http://www.google.com/""))
* Updates `README.md` file ([dbcf871](""http://www.google.com/""))
* Does a thing - breaks a thing! ([8fb161d](""http://www.google.com/""))
* Reverts `8fb161d` ([cc866fc](""http://www.google.com/""))
* MERGE main into feature/pointless-feature ([b62641e](""http://www.google.com/""))
### Fiels Changed
* `README.md`
* `index.js`
---
> **Note**: This format is not customisable in version 1 of this task. A future iteration should support templating / formatting. 

 