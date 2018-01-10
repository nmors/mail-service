# mail-service

master: [![CircleCI](https://circleci.com/gh/nmors/mail-service/tree/master.svg?style=svg)](https://circleci.com/gh/nmors/mail-service/tree/master)
develop: [![CircleCI](https://circleci.com/gh/nmors/mail-service/tree/develop.svg?style=svg)](https://circleci.com/gh/nmors/mail-service/tree/develop)

An reliable mail service written with TypeScript.


## Quick start

[Live example can be viewed here](https://morsmail.herokuapp.com])

[API Documentation](https://morsmail.herokuapp.com/docs])


To run locally:

```
git clone https://github.com/nmors/mail-service
cd mail-service

npm install
npm start
```

Or you can deploy your own instance by clicking here: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


## Running Tests

Tests are written using the [Jest Framework](https://facebook.github.io/jest)

```
npm test
```

## Architecture

Please view the architecture document by clicking [HERE](./ARCHITECTURE.md)

## TODO

 - add firebase creds to circleci and heroku so develop branch builds

 - Improve error handling & add a retry feature
 - Improve test coverage
 - performance; add a db index on the 'status' field so pending message lookup is faster and/or move successful messages elsewhere
 - Have a base MailService class that each mail service extends
 - Add authentication
 - Support for sending HTML emails (handlebars templates or something would be nice?)
 - investigate using firebase feature .setWithPriority() and .orderByPriority()
