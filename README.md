# mail-service

master: [![CircleCI](https://circleci.com/gh/nmors/mail-service/tree/master.svg?style=svg)](https://circleci.com/gh/nmors/mail-service/tree/master)
develop: [![CircleCI](https://circleci.com/gh/nmors/mail-service/tree/develop.svg?style=svg)](https://circleci.com/gh/nmors/mail-service/tree/develop)

An reliable mail service written with TypeScript.


## Quick start

Configuration:
 - Install NodeJS v8.8.1 (not tested on any other version)
 - Set environment variables, or create a `.env` file with the below key/values:

Required:
```
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
SENDGRID_API_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DB_URL=
FIREBASE_PROJECT_ID=
```

Optional:
```
PORT=3050
LOG_LEVEL=debug
```

Then run the command:

```
npm i & npm start
```
That's it! Server will be running on port specified!

[API Documentation](https://morsmail.herokuapp.com/docs)

Live example can be viewed at: https://morsmail.herokuapp.com

Or you can deploy your own instance automagically by clicking here: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


## Running Tests

Tests are written using the [Jest Framework](https://facebook.github.io/jest)

```
npm test
```

## Architecture

Please view the architecture document by clicking [HERE](./ARCHITECTURE.md)

## TODO

#### Important, before production release
 - Add firebase creds to circleci and heroku so develop branch builds
 - Check the mailservice if has been successful on their side
 - Improve / fix request validation
 - Improve error handling
 - Improve test coverage, setup mock db, setup more mocks and tests

#### Nice to have:
 - potentially break apart SendMailController, as it may have too many responsibilities
 - performance; add a db index on the 'status' field so pending message lookup is faster and/or move successful messages elsewhere
 - compilation instead of ts-node?
 - Have a base MailService class that each mail service extends
 - Add authentication
 - Support for sending HTML emails (handlebars templates or something would be nice?)
 - investigate using firebase feature .setWithPriority() and .orderByPriority()

