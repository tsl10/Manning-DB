# KAMI MARINE

KAMI MARINE is an Express and EJS crew portal for seafarer registration, profiles, documents, experience, and administration.

## Local Deployment

Requirements: Node.js 18 or newer and MySQL.

Install dependencies and start the local server:

```powershell
npm install
$env:NODE_ENV = "development"
$env:APP_URL = "http://localhost:3000"
npm start
```

The application is available at `http://localhost:3000`. Import [database/kamilmwg_tutorial.sql](database/kamilmwg_tutorial.sql) into a local MySQL database and configure the `DB_*` variables described below.

For local Google OAuth testing, add this redirect URI in Google Cloud Console:

```text
http://localhost:3000/auth/google/callback
```

Use the matching local callback in your environment configuration:

```env
NODE_ENV=development
APP_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=local-development-secret
```

Google sign-in is available when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured. The current app stores accounts in memory, so newly registered or Google-linked accounts are lost when the server restarts.

## Unit Testing

Run the test suite with:

```powershell
npm test
```

The project uses Node.js's built-in test runner, so no test framework is required. Add test files using the `*.test.js` or `*.spec.js` naming convention, preferably inside a `test/` directory:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('example', () => {
	assert.equal(1 + 1, 2);
});
```

Unit tests should not use production credentials or modify the production database. Use a separate test database and environment variables such as `DB_NAME=kamilmwg_tutorial_test`. For route-level tests, export the Express app without starting the server and use a request-testing library such as `supertest`.

The current application is primarily contained in [app.js](app.js), uses in-memory `mockUsers`, and starts the server immediately. Refactoring authentication and database access into modules will make isolated unit testing easier.

## Production Setup

Requirements: Node.js 18 or newer, MySQL, an HTTPS domain, and a hosting provider that can configure environment variables.

```powershell
npm install
npm install
$env:NODE_ENV = "production"
npm start
```

Set `NODE_ENV`, `PORT`, `APP_URL`, `SESSION_SECRET`, and the database values in the hosting provider's environment settings. Do not commit production secrets or a `.env` file. Import [database/kamilmwg_tutorial.sql](database/kamilmwg_tutorial.sql) into the production MySQL database before starting the application.

Use these database environment variables:

```env
DB_HOST=your-production-mysql-host
DB_PORT=3306
DB_USER=your-production-mysql-user
DB_PASSWORD=your-production-mysql-password
DB_NAME=kamilmwg_tutorial
```

## Google Sign-In

Google sign-in uses OAuth 2.0. Production Google sign-in must use the deployed HTTPS domain; localhost callback URLs are not part of the production setup. Use Google's stable profile ID (`google_id`) to link accounts, while keeping the existing email/password login available.

### 1. Create Google OAuth credentials

In [Google Cloud Console](https://console.cloud.google.com/):

1. Create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth client ID for a web application.
4. Add this authorized redirect URI, replacing the domain with the real production domain:

```text
https://your-production-domain.example/auth/google/callback
```

The callback URL must match the configured application callback exactly, including the HTTPS scheme and path.

### 2. Configure environment variables

Create a `.env` file in the project root for local development (or set these values in the hosting provider). Do not commit the file:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NODE_ENV=production
APP_URL=https://your-production-domain.example
GOOGLE_CALLBACK_URL=https://your-production-domain.example/auth/google/callback
SESSION_SECRET=use-a-long-random-value
```

Keep the session secret and Google client secret private.

When both Google credentials are present, separate Google buttons appear on the login and registration pages. Google sign-in only succeeds for an account already linked to that Google ID. New users must choose Google account creation first. New Google accounts use Google's first name, last name, and verified email; other crew profile fields start blank for the user to fill in. During Google registration, a verified email matching an existing unlinked account is linked to it without replacing its existing profile details; an email already linked to another Google ID is rejected. A Google-only user can set a local password in **Password Settings** after signing in; users who already have a password must provide it to change it.

User records are currently held in the in-memory `mockUsers` array in [app.js](app.js). Google account creation, account linking, and password changes work with this development store, but changes are lost on restart and are not shared across multiple server instances. Use persistent user storage with unique email and Google ID constraints before relying on these features in production.

## Production Checklist

- Use an HTTPS domain and configure the exact Google callback URL in Google Cloud Console.
- Set `NODE_ENV=production` and a long, random `SESSION_SECRET` in the hosting platform.
- Keep `GOOGLE_CLIENT_SECRET` and database credentials in hosting-provider secrets.
- Run behind the platform's reverse proxy with secure cookies enabled.
- Use a persistent MySQL database rather than the in-memory `mockUsers` array.
- Remove the sample admin credentials and replace the hard-coded admin authentication before deployment.

---

# Manning-Test



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/kamimtc/manning-test.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://gitlab.com/kamimtc/manning-test/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
* [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
