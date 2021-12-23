# LeLeConsole Contributing Guide

Hi! I'm really excited that you are interested in contributing to LeLeConsole. Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [LeLeConsole Contributing Guide](#leleconsole-contributing-guide)
  - [Issue Reporting Guidelines](#issue-reporting-guidelines)
  - [Pull Request Guidelines](#pull-request-guidelines)
  - [Project Structure](#project-structure)

## Issue Reporting Guidelines

- Always use [https://new-issue.vuejs.org/](https://new-issue.vuejs.org/) to create new issues.

## Pull Request Guidelines

- The `master` branch is just a snapshot of the latest stable release. All development should be done in dedicated branches. **Do not submit PRs against the `master` branch.**

- Checkout a topic branch from the relevant branch, e.g. `dev`, and merge back against that branch.

- If adding a new feature:
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR.


## Project Structure

- **`templates`**: config json template. 
 
- **`keyboards`**: all support keyboards json config file. 
