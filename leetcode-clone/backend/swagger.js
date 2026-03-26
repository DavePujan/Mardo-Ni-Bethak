const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Quiz Portal API',
        description: 'API Documentation for the Quiz Portal',
    },
    host: 'localhost:5000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json';
const routes = ['./server.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);
