# Architecture

```
                                                 ,--> [MailService] --> [3rd Party (mailgun)]
[API] --> [SendMailController] --> [Firebase] --<
                                                 `--> [MailService] --> [3rd Party (sendgrid)]
```

## Sending Mail

The process of sending mail is broken up into three stages.
  - API
  - Controller
  - Firebase
  - Services

In order to send mail through the application, you must use the HTTP REST API.

### API

The API is very simple, as the application only needs to do one thing, which is send email.

#### POST /message
It expects JSON request body with 4 fields, all of which are strings. (to, from, subject, text).

*For detailed API usage, including examples, you can visit `/docs` on the server.*


#### Validation
Validation on the api is done via swagger validator. It will check the JSON schema generated from the API specification against all incoming requests.


### SendMailController

The controller will be responsible for queueing up mail to be sent:
 - Validate and queue the message
 - sends response back to user with the ID of the message
 - listens for pending emails and attempts in firebase and schedules delivery.
 - update the status of an attempt to success or failed
 - retry using another service if necessary

The SendMailController is designed in a way where new services can be added easily in the future.


### MailStatusController

This controller is responsible for message delivery status interaction:
  - TODO: allows user to check the status of the message
  - TODO: checks the mailservices if has been successful on their side
  - TODO: ...


### Firebase
 - stores emails and tracks attempts
 - sends callback to SendMailController when new emails are added
 - sends callback to SendMailController when new attempts are scheduled


#### Data Model
 - An email can have many attempts
 - both status of email and attempts can either be one of three values: [pending, success, failed]
   emails: [
     {
       key,
       timestamp,
       status,
       to: [email],
       from,
       subject,
       text,
       attempts: [ {status, timestamp} ]
     }
  ]


### Mail Services

each service in the application is responsible for talking to the respective 3rd party API in order to have it dispatch an email to the intended recipient. They have responsibility of:
 - transforming the message data into the correct format
 - performing a http request to the 3rd party
 - returning the result back to the controller if successful
 - throwing an error at the controller if failed


## Libraries

- "ts-node"
- "typescript"

Typescript is used to extend the javascript language with more features to provide a nice developer experience.

- "jest"
- "ts-jest"

jest is a testing framework and high performance test runner. it uses jasmine and istanbul under the hood and has some nice features.

- "dotenv"

dotenv is a great way to manage configuration of the application via environment variables and/or a `.env` file

- "bluebird"

Bluebird is included only because I wanted to use Promise.reduce(). There are other ways to acheive similair functionality, but I think this is a little more consice and readable.

- "body-parser"
- "express"

Express and body-parser is used to handle and parse incoming API requests

- "form-data"
- "node-fetch"

form-data `FormData()` and node-fetch `fetch()` both are native APIs in modern browsers. They were chosen to help formulate and make HTTP requests.

- "base-64"

base-64 is a libary used to encode the authentication header used when formulating the request to mailgun's API.

- "swagger-tools"
- "js-yaml"

swagger-tools and js-yaml together provide a nice way to present API documentation as part of the server.

- "winston"

winston is a popular and powerful logging library used to save logs to STDOUT and also has other output plugins, such as file which is used to save audit logs to disk.
