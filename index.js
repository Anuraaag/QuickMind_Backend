const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();

const connectToMongo = require('./db');
connectToMongo();

const app = express();
const port = 5000;

const rateLimit = require("express-rate-limit");
const ipLimiter = rateLimit({
    windowMs: 5 * 1000, /** 10 second window */
    max: 1, /** limit each IP to 100 requests per windowMs */
    message: "Too many requests... ughh give me a break already!",
    keyGenerator: function (req) {
        return req.ip;
    }
});

const userLimiter = rateLimit({
    windowMs: 5 * 1000,
    max: 1,
    message: "Too many requests... ughh give me a break already!",
    keyGenerator: function (req) {
        return req.header('auth-token');
    }
});
app.use('/api', ipLimiter, userLimiter);

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./controllers/auth'));
app.use('/api/query', require('./controllers/query'));

app.listen(process.env.PORT || port, () => {
    console.log(`Quickmind is all ears!`);
});

