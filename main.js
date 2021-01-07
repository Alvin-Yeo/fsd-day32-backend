// load libraries
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const expressWS = require('express-ws');

// environment configuration
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// global variables
const ROOM = {};

const mkSystemMessage = (message) => {
    return JSON.stringify({
        from: '[SYSTEM]',
        message,
        timestamp: new Date().toString()
    });
};

// create an instance of express
const app = express();
const appWS = expressWS(app);

// cors
app.use(cors());

// log all requets with morgans
app.use(morgan('combined'));

// /chat/:chatroom
app.ws('/chat', (ws, req) => {
    const name = req.query.name;
    console.info(`[INFO] New websocket connection for ${name}`);

    // add the web socket connection to the room
    ws.participantName = name;
    ROOM[name] = ws;

    // broadcast welcome message
    for(let user in ROOM) {
        ROOM[user].send(mkSystemMessage(`${name} has joined the chat.`));
    }

    // setup
    ws.on('message', (payload) => {
        console.info(`Incoming message: ${payload}`);

        // construct the message and stringify it
        const chat = JSON.stringify({
            from: name,
            message: payload,
            timestamp: new Date().toString()
        });

        // broadcast to everyone in the ROOM
        for(let user in ROOM) {
            ROOM[user].send(chat);
        }
    });

    ws.on('close', () => {
        console.info(`[INFO] Closing websocket connection for ${name}`);

        // close our end of the connection
        ROOM[name].close();
        // remove ourselves from the object
        delete ROOM[name];

        // broadcast leaving message
        for(let user in ROOM) {
            ROOM[user].send(mkSystemMessage(`${name} left has the chat.`));
        }
    });
});

// start app
app.listen(PORT, () => {
    console.info(`[INFO] Application started on port ${PORT} at ${new Date()}`);
});