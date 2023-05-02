const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
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
                return generateResponse(false, `Enter a valid name.`, [], []);

            if (!body.email || !/\S+@\S+\.\S+/.test(body.email) || body.email.length > 256)
                return generateResponse(false, `Enter a valid email.`, [], []);

            if (!body.password || body.password.length < 5 || body.password.length > 127)
                return generateResponse(false, `Password must be at least 5 characters.`, [], []);

            /** Checking if user already exists */
            return User.findOne({ email: body.email })
                .then(user => {
                    if (user)
                        throw new Error("Account with this email already exists.");
                    // add reset pasword functionality // ask if user wants to reset here, suggest to use forgot password functionality

                    /** Initiate creating user */
                    return bcrypt.genSalt(); /** generate salt */
                })
                .then(salt => {
                    if (salt)
                        return bcrypt.hash(body.password, salt);
                    else
                        throw new Error("Salt creation failed.");

                }) /** generate hash */
                .then(hash => {
                    if (hash) {
                        let username = body.name.split(" ")[0] !== "" ? body.name.split(" ")[0] : "user";
                        username = username.charAt(0).toUpperCase() + username.slice(1);
                        return User.create({
                            name: body.name, email: body.email, password_hash: hash, username: username
                        });
                    } else
                        throw new Error("Hash creation failed.");

                })
                .then(addedUser => {

                    if (addedUser) {
                        /** User completes registration, so we create and send them a JWT token */
                        const payload = {
                            user: {
                                id: addedUser.id
                            }
                        };
                        const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn });
                        return generateResponse(true, `User signed up successfully`, { jwtToken, username: addedUser.username, freeRequestsBalance: freeRequestsLimit }, []);
                    } else
                        throw new Error("User not created. Database issue.");
                })
                .catch(error => generateResponse(false, error.message, [], error))

        } else
            return generateResponse(false, `Invalid data`, [], error);

    } catch (error) {
        return generateResponse(false, `Internal Server Error`, [], error);
    }
};


const logInUser = async (req) => {

    try {
        const body = req.body ? JSON.parse(req.body) : null;
        let user = null;

        if (body) {

            if (!body.email || !/\S+@\S+\.\S+/.test(body.email) || body.email.length > 256)
                return generateResponse(false, `Enter valid credentials.`, [], []);

            if (!body.password || body.password.length < 5 || body.password.length > 127)
                return generateResponse(false, `Enter valid credentials.`, [], []);

            return User.findOne({ email: body.email })
                .then(fetchedUser => {

                    if (!fetchedUser)
                        throw new Error("Enter valid credentials.");

                    user = fetchedUser; /** user found */
                    return bcrypt.compare(body.password, user.password_hash); /** Verifying password */
                })
                .then(passwordMatched => {

                    if (!passwordMatched)
                        throw new Error("Enter valid credentials.");

                    /** User is authenticated. Create and send JWT token */
                    const payload = {
                        user: {
                            id: user.id
                        }
                    };
                    const jwtToken = jwt.sign(payload, JWT_SECRET);
                    return generateResponse(true, `User logged in successfully!`, { jwtToken, username: user.username, freeRequestsBalance: freeRequestsLimit - user.queryCount }, []);

                })
                .catch(error => generateResponse(false, error.message, [], error))
        } else
            return generateResponse(false, `Invalid data`, [], error);

    } catch (error) {
        return generateResponse(false, `Internal Server Error`, [], error);
    }
}


module.exports = { createUser, logInUser };