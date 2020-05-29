# Humanitarian Making API

This project is built using Typescript(v3.9.3) in NodeJS (v10.10), ExpressJS and MongoDB. It running as a Firebase Function.

## Local server
Install NodeJS v10.10 and Firebase using 
```
npm install -g firebase-tools
```
Clone the project and the install the project NPM modules using 
```
npm install
```
To run the server using the Typescript needs to be transpiled to Javascript to do this run. 
```
npm run build
```
There are firebase projects setup. One for for the test environment and one for production. Use the test one for local development as the Web App is configured to use it. Select the test project using: 
```
firebase use default
```
No you can start the Firebase Emulators using:
```
firebase serve
```

## Development server: <https://test.humanitarianmaking.org>

An automatic deploy to the test server is setup. Any changes to the dev branch will trigger this deploy.

## Production server: <https://humanitarianmaking.org>

An automatic deploy to the production server is setup. Any merges to the Master branch will trigger this.


