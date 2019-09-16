# Contributing to @huddly/sdk

✨ Thanks for contributing our open source sdk module **@huddly/sdk**! ✨

As a contributor, here are some of the guidelines we would like you to follow:
- [How can I contribute?](#how-can-i-contribute)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding rules](#coding-rules)
- [Working with the code](#working-with-the-code)

Also, we strongly recommend that you read [How to Contribute to Open Source](https://opensource.guide/how-to-contribute).

## How can I contribute?
You as a user of our sdk module are the perfect candidate for contributing on improving our documentation: typo corrections, clarifications, more examples (rest api, azure iot ...).

Please try to be concise and clear when writing documentation, use links when appropriate and write examples if deemd necessary to help the reader understand better.

### Give feedback on issues
Contribute on submitted issues by discussing implementation, architecture, design and/or structure. Give feedback or provide additional information.

### Fix bugs or implement new feature
You're thinking to implement a cool new feature on our sdk module or have found a bug that you would like to fix? That is awasome and we appreciate your effort. Fork our sdk github repo and submit a pull request. Use the labels to indicate the nature of the new feature (or bugfix) and request reviews from some of the [@huddly/maintainers](https://github.com/orgs/Huddly/teams/app).

## Submitting a Pull Request
Good pull requests, no matter if they are patches, improvements, or new features, are a fantastic help. Please make sure your Pull Requests remain focused in scope and don't have unrelated commits.

**It is Important** to ask first before you decide to go ahead and work on a significant pull request (e.g. implementing new features, refactoring) if you don't want to spend time on implementing something that might end up not being merged into master.

If you are unfamiliar with the procedure of creating a Pull Request, fear not. [Here is a great tutorial](https://opensource.guide/how-to-contribute/#opening-a-pull-request) on how to do just that :)

Here is a summary of the steps to follow:

1. [Set up the workspace](#set-up-the-workspace)
2. If you cloned a while ago, get the latest changes from upstream and update dependencies:
```bash
$ git checkout master
$ git pull upstream master
$ rm -rf node_modules
$ npm install
```
3. Create a new topic branch to contain your feature, change, or fix:
```bash
$ git checkout -b <topic-branch-name>
```
4. Make your code changes, following the [Coding rules](#coding-rules)
5. Push your topic branch up to your fork:
```bash
$ git push origin <topic-branch-name>
```
6. [Open a Pull Request](https://help.github.com/articles/creating-a-pull-request/#creating-the-pull-request) with a clear title and description.

**Tips**:

- For ambitious tasks, open a Pull Request as soon as possible with the `[WIP]` prefix in the title, in order to get feedback and help from the community.
- [Allow Huddly maintainers to make changes to your Pull Request branch](https://help.github.com/articles/allowing-changes-to-a-pull-request-branch-created-from-a-fork). This way, we can rebase it and make some minor changes if necessary. All changes we make will be done in new commit and we'll ask for your approval before merging them.

## Coding rules

### Source code

To ensure consistency and quality throughout the source code, all code modifications must have:
- No [linting or code formatting](#lint) errors
- A [test](#tests) for every possible case introduced by your code change
- **100%** test coverage on your code change
- [Valid commit message(s)](#commit-message-guidelines)
- Documentation for new features
- Updated documentation for modified features

### Documentation

To ensure consistency and quality, all documentation modifications must:
- Refer to brand in [bold](https://help.github.com/articles/basic-writing-and-formatting-syntax/#styling-text) with proper capitalization, i.e. **GitHub**, **@huddly/sdk**, **npm**
- Prefer [tables](https://help.github.com/articles/organizing-information-with-tables) over [lists](https://help.github.com/articles/basic-writing-and-formatting-syntax/#lists) when listing key values, i.e. List of options with their description
- Use [links](https://help.github.com/articles/basic-writing-and-formatting-syntax/#links) when you are referring to:
  - a **@huddly/sdk** concept described somewhere else in the documentation, i.e. How to [contribute](CONTRIBUTING.md)
  - a third-party product/brand/service, i.e. Integrate with [GitHub](https://github.com)
  - an external concept or feature, i.e. Create a [GitHub release](https://help.github.com/articles/creating-releases)
  - a package or module, i.e. The [`device-api-usb`](https://github.com/Huddly/device-api-usb) module
- Use the the [single backtick `code` quoting](https://help.github.com/articles/basic-writing-and-formatting-syntax/#quoting-code) for:
  - commands inside sentences, i.e. the `start` detector command
  - programming language keywords, i.e. `function`, `async`, `String`
  - packages or modules, i.e. The [`@huddly/device-api-usb`](https://github.com/Huddly/device-api-usb) module
- Use the the [triple backtick `code` formatting](https://help.github.com/articles/creating-and-highlighting-code-blocks) for:
  - code examples
  - configuration examples
  - sequence of command lines

### Commit message guidelines

We are two modules for helping us structure our commit message in a clean, undestandable and parasable way. These tools are `commitizen` and `az-conventional-changelog`.

[commitizen](https://github.com/commitizen/cz-cli) provides a wizard that will ask you a few meta questions about your commit and [cz-conventional-changelog](https://github.com/commitizen/cz-conventional-changelog) is a plugin that describes the desired commit format.

Please keep in mind that the commit messages will be included in the release notes, therefore it is important that you use the proper way of creating a git commit message.

After staging your changes with `git add`, run `git cz` to start the interactive commit message CLI.

**NOTE** We require that you have properly formatted commits when submitting a PR.

**Tips**:

If you are used to creating a lot of commits before submitting a pull request, you can create standard git commits during development. However, when preparing your feature branch for PR and merge, make sure you do the following:
- Squash all yourt commits in one (if possible)
- Create a new commit using `git cz` with a proper commit message
- Rebase your commits so that all your previously squashed commits are rebased into your last properly formatted commit. Use that commit to submit the PR.

Examples:
```commit
Author: Brikend Rama <brikend@huddly.com>
Date:   Wed Jun 5 09:41:05 2019 +0200

feat(release-process): added plugins for aiding release process

Using the commitizen and az-conventional-changelog dependenceis it is possible to structure the
commit message in a proper and standard way which will help possible another module for generating the release notes when releasing a new version of the sdk dependency 
```

## Working with the code

[Fork](https://guides.github.com/activities/forking/#fork) the project, [clone](https://guides.github.com/activities/forking/#clone) your fork, configure the remotes and install the dependencies:

```bash
# Clone your fork of the repo into the current directory
$ git clone git@github.com:Huddly/sdk.git
# Navigate to the newly cloned directory
$ cd sdk
# Assign the original repo to a remote called "upstream"
$ git remote add upstream git@github.com:Huddly/sdk.git
# Install the dependencies using npm
$ npm install
```

### Lint

The sdk project uses tsling for linting with the [Arbinb Linting Standard](https://github.com/airbnb/javascript) and [Prettier](https://prettier.io) for code formatting.

When running a git commit command, the `precommit` hook is triggered which will run the linting and code formatting commands respectively. If your code has linting or formatting issues, your commit will be aborted.

You can also run the linter and code foramtter commands manually for fixing the formatting problems on your code changes:
```bash
$ npm run tslint
$ npm run prettier
```

### Tests and Code Coverage

You can run the unit tests manually by running the `npm run test` command. Node that this command is run as part of the commit hook too. We use [`nyc`](https://github.com/istanbuljs/nyc) for code coverage that prints out the coverage results at the end of the test command and generates the coverage report.


### Updating documentation pages
Updating or generating new content on the documentation pages you are required to install a specific version of [Compodoc](https://compodoc.app/) npm module. Run the following command to install compodoc on your machine:

```
npm install -g @compodoc/compodoc@1.1.8
```
After having installed compodoc as a global dependency, you can run our script for generating the @huddly/sdk documentation:
```
npm run compodoc
```
