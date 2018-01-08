# mail-service

[![CircleCI](https://circleci.com/gh/nmors/mail-service/tree/master.svg?style=svg)](https://circleci.com/gh/nmors/mail-service/tree/master)

An reliable mail service written with TypeScript.


## Quick start

[Live example can be viewed here](https://morsmail.herokuapp.com])


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

 - Add a queuing mechanism
 - Add authentication
 - Support sending to multiple recipients
 - Improve error handling & add a retry feature
 - Have a base MailService class that each mail service extends
 - Support for sending HTML emails (handlebars templates or something would be nice?)
 - Improve test coverage

