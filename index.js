const express = require('express');

const dotenv = require('dotenv');
dotenv.config();

const connectToMongo = require('./db');
connectToMongo();

const app = express();
const port = 5000;

// const serverless = require('serverless-http'); /** for lambda */

// const cors = require('cors');
// app.use(cors());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

const rateLimit = require("express-rate-limit");
// const ipLimiter = rateLimit({
//     windowMs: 5 * 1000, /** 5 second window */
//     max: 1, /** limit each IP to 1 request per windowMs */
//     message: "Too many requests... ughh give me a break already!",
//     keyGenerator: function (req) {
//         return req.ip;
//     }
// });
// const userLimiter = rateLimit({
//     windowMs: 5 * 1000,
//     max: 1,
//     message: "Too many requests... ughh give me a break already!",
//     keyGenerator: function (req) {
//         console.log(req.ip);
//         console.log(req.header('auth-token'));
//         return req.header('auth-token');
//     }
// });
// app.use('/api', userLimiter);

// app.use('/api', ipLimiter);

app.use(express.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use('/api/auth', require('./controllers/auth'));
app.use('/api/query', require('./controllers/query'));

app.listen(process.env.PORT || port, () => {
    console.log(`Quickmind is all ears!`);
});

/** to run in lambda */
// app.get('/', (req, res) => {
//     res.send('Hello from Quickmind!');
// });

// Define the Lambda handler function
// module.exports.handler = serverless(app);
/** to run in lambda */
