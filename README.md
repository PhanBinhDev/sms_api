# Advanced Nodejs Api Structure

A simple yet efficient implemented Node.js API structure with Dependency Injection

## Project Structure

```

    src
    |   index.js            # App entry point
    |___startup.js          # API startup logic
    |___config.js           # Contains all your configuration and environment variables
    |___controllers         # Express route controllers for all the API endpoints
    |___infrastructure
        |___containers      # Dependency injection container
        |___middlewares     # Contains all your middlewares
        |___services        # Contains all the business logic

```

## How to run the API

1. To get started, first clone the project

   ```
   $ git clone
   $ cd server/src
   ```

2. Install the dependencies in the local node_modules folder and run the server.

   ```
   $ npm install
   $ npm run server
   ```
