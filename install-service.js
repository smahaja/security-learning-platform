const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'Security Learning Platform',
    description: 'Security Learning Platform Web Application Service',
    script: path.join(__dirname, 'server.js'),
    env: [{
        name: "NODE_ENV",
        value: "production"
    }, {
        name: "PORT",
        value: "3001"
    }]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    console.log('Service installed successfully!');
    svc.start();
    console.log('Service started on port 3001.');
});

// Listen for errors
svc.on('error', function (err) {
    console.error('Error:', err);
});

// Listen for already installed
svc.on('alreadyinstalled', function () {
    console.log('This service is already installed.');
});

console.log('Installing service...');
svc.install();
