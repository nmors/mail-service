# mail-service

An reliable mail service written with typescript.


## Quick start

```
git clone https://github.com/nmors/mail-service
cd mail-service

npm install
npm start
```


## Running Tests

Tests are written using the (https://facebook.github.io/jest)[Jest Framework]

```
npm test
```


## TODO

Add a queuing mechanism
have a base MailService class that each service extends
improve error handling & add a retry feature
support sending to multiple recipients
support for sending HTML emails (handlebars templates or something would be nice?)
improve test coverage
