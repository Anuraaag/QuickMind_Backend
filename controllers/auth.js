const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
// const cookie = require('cookie');
const freeRequestsLimit = 30;

const generateResponse = require("../helpers/response");

const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = `${process.env.JWT_SECRET}`;
const expiresIn = '10d';

const createUser = async (req) => {
    try {

        const body = req.body ? JSON.parse(req.body) : null;
        if (body) {

            if (!body.name || body.name.length < 2 || body.name.length > 192)
                return generateResponse(false, `Enter a valid name`, [], []);

            if (!body.email || !/\S+@\S+\.\S+/.test(body.email) || body.email.length > 256)
                return generateResponse(false, `Enter a valid email`, [], []);

            if (!body.password || body.password.length < 5 || body.password.length > 127)
                return generateResponse(false, `Password must be at least 5 characters`, [], []);

            /** Checking if user already exists */
            let user = await User.findOne({ email: body.email });
            if (user)
                return generateResponse(false, `Account with this email already exists`, [], []);

            /** Creating user */
            const salt = await bcrypt.genSalt();
            const hash = await bcrypt.hash(body.password, salt);
            const username = body.name.split(" ")[0] !== "" ? body.name.split(" ")[0] : "user";
            user = await User.create({
                name: body.name,
                email: body.email,
                password_hash: hash,
                username: username
            });

            /** User completes registration, so we create and send them a JWT token */
            const payload = {
                user: {
                    id: user.id
                }
            }
            const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn });

            /** Calculating a date 30 days from now to expire the cookie then */
            // const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            // const response = {
            //     headers: {
            //         'Access-Control-Allow-Origin': 'chrome-extension://akmkcicklllnibehnoeikjfihhlpcoio',
            //         'Access-Control-Allow-Credentials': true,
            //         'Set-Cookie': cookie.serialize('jwt_token', jwtToken, {
            //             httpOnly: true,
            //             secure: true,
            //             sameSite: 'none',
            //             expires: thirtyDaysFromNow
            //         })
            //     },
            //     body: generateResponse(true, `User signed up successfully`, [], [])
            // };
            return generateResponse(true, `User signed up successfully`, { jwtToken, username, freeRequestsLimit }, []);
        }
    } catch (error) {
        console.log(error);
        return generateResponse(false, `Internal Server Error`, [], error);
    }
};

/** Logging in a user - /api/auth/log-in
 * first argument has the path,
 * second arg contains the rules, 
 * third implements the body
*/
// router.post('/log-in', [
//     body('email', 'Enter a valid email').isEmail().isLength({ max: 256 }),
//     body('password', 'Password can not be blank').isLength({ min: 4 }).isLength({ max: 127 })
// ], async (req, res) => {
//     try {
//         //Checking for error based on aforementioned rules
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json(generateResponse(false, errors.array()[0].msg, [], errors.array()));
//         }

//         //Checking if user exists
//         let user = await User.findOne({ email: req.body.email }); // db crud is async
//         if (!user) {
//             return res.status(400).json(generateResponse(false, `Please enter your correct credentials`, [], []));
//         }

//         //Verifying password
//         const passwordCompare = await bcrypt.compare(req.body.password, user.password_hash);
//         if (!passwordCompare) {
//             return res.status(400).json(generateResponse(false, `Please enter your correct credentials`, [], []));
//         }

//         // User is authenticated already, so we create and send them a JWT token
//         const payload = {
//             user: {
//                 id: user.id
//             }
//         };

//         /** Calculating a date 30 days from now to expire the cookie then */
//         const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
//         const jwtToken = jwt.sign(payload, JWT_SECRET);

//         res.cookie('jwt_token', jwtToken, { httpOnly: true, expires: thirtyDaysFromNow, sameSite: "None", secure: "true" }).json(generateResponse(true, `logged in successfully`, [], []));

//     } catch (error) {
//         console.log(error);
//         res.status(500).send(generateResponse(false, `Internal Server Error`, [], []));
//     }
// });

module.exports = { createUser };