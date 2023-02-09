const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const generateResponse = require("../helpers/response");

const JWT_SECRET = `${process.env.JWT_SECRET}`;

/** Creating a new user - /api/auth/create-user 
 * first argument has the path,
 * second arg contains the rules, 
 * third implements the body
*/
router.post('/create-user', [
    body('name', 'Enter a valid name').isLength({ min: 2 }).isLength({ max: 192 }),
    body('email', 'Enter a valid email').isEmail().isLength({ max: 256 }),
    body('password', 'Password must be at least 5 characters').isLength({ min: 4 }).isLength({ max: 127 })
], async (req, res) => {
    try {
        //Checking for errors based on aforementioned rules
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json(generateResponse(false, errors.array()[0].msg, [], errors.array()));

        //Checking if user already exists
        let user = await User.findOne({ email: req.body.email }) // db crud is async
        if (user)
            return res.status(400).json(generateResponse(false, `Account with this email already exists`, [], []));

        //Creating user 
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(req.body.password, salt);

        user = await User.create({ // db crud is async
            name: req.body.name,
            email: req.body.email,
            password_hash: hash,
            username: req.body.name.split(" ")[0]
        });

        // User completes registration, so we create and send them a JWT token
        const payload = {
            user: {
                id: user.id
            }
        }
        const jwtToken = jwt.sign(payload, JWT_SECRET);

        /** Calculating a date 30 days from now to expire the cookie then */
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        res.cookie('jwt_token', jwtToken, { httpOnly: true, expires: thirtyDaysFromNow }).json(generateResponse(true, `signed up successfully`, [], []));

    } catch (error) {
        console.log(error);
        res.status(500).send(generateResponse(false, `Internal Server Error`, [], []));
    }
});

/** Logging in a user - /api/auth/log-in
 * first argument has the path,
 * second arg contains the rules, 
 * third implements the body
*/
router.post('/log-in', [
    body('email', 'Enter a valid email').isEmail().isLength({ max: 256 }),
    body('password', 'Password can not be blank').isLength({ min: 4 }).isLength({ max: 127 })
], async (req, res) => {
    try {
        //Checking for error based on aforementioned rules
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(generateResponse(false, errors.array()[0].msg, [], errors.array()));
        }

        //Checking if user exists
        let user = await User.findOne({ email: req.body.email }); // db crud is async
        if (!user) {
            return res.status(400).json(generateResponse(false, `Please enter your correct credentials`, [], []));
        }

        //Verifying password
        const passwordCompare = await bcrypt.compare(req.body.password, user.password_hash);
        if (!passwordCompare) {
            return res.status(400).json(generateResponse(false, `Please enter your correct credentials`, [], []));
        }

        // User is authenticated already, so we create and send them a JWT token
        const payload = {
            user: {
                id: user.id
            }
        };

        /** Calculating a date 30 days from now to expire the cookie then */
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const jwtToken = jwt.sign(payload, JWT_SECRET);

        res.cookie('jwt_token', jwtToken, { httpOnly: true, expires: thirtyDaysFromNow }).json(generateResponse(true, `logged in successfully`, [], []));

    } catch (error) {
        console.log(error);
        res.status(500).send(generateResponse(false, `Internal Server Error`, [], []));
    }
});

module.exports = router;