const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const freeRequestsLimit = 30;

const generateResponse = require("../helpers/response");

const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = `${process.env.JWT_SECRET}`;
// const expiresIn = '10d';

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const ses = new AWS.SES();

const createUser = async (req) => {
    try {

        const body = req.body ? JSON.parse(req.body) : null;
        if (body) {

            if (!body.name || body.name.length < 2 || body.name.length > 192)
                return generateResponse(false, `Enter a valid name`, [], []);

            if (!body.email || !/\S+@\S+\.\S+/.test(body.email) || body.email.length > 256)
                return generateResponse(false, `Enter a valid email`, [], []);
            else
                body.email = body.email.toLowerCase();

            if (!body.password || body.password.length < 5 || body.password.length > 127)
                return generateResponse(false, `Password must be at least 5 characters`, [], []);

            /** Checking if user already exists */
            return User.findOne({ email: body.email })
                .then(user => {
                    if (user)
                        throw new Error("Account with this email already exists");
                    // add reset pasword functionality // ask if user wants to reset here, suggest to use forgot password functionality
                })
                /** Initiate creating user */
                .then(() => bcrypt.genSalt()) /** generate and return salt */

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
                        // const reset_code = Math.random().toString(16).substring(0, 6);
                        return User.create({
                            name: body.name,
                            email: body.email,
                            password_hash: hash,
                            username: username
                        });
                    } else
                        throw new Error("Hash creation failed.");

                })
                /** Work in progress start */
                //1 check for a template

                //2 if it doesn't exist, create it
                // .then(async addedUser => {
                //     if (addedUser) {
                //         return new Promise((resolve, reject) => {
                //             /** sending verification email */

                //             const params = {
                //                 FromEmailAddress: 'anuraggupta.dev@gmail.com',
                //                 TemplateContent: '<html> <body> <p>Hi {{user}}!</p> <p>Please click the below link to verify your email address</p> <p> {{verifyLink}} </p> </body> </html>',
                //                 TemplateName: 'Email-Verification',
                //                 TemplateSubject: 'QuickMind - Email Verification',
                //                 SuccessRedirectionURL: `https://example.com`,
                //                 FailureRedirectionURL: `https://example.com`
                //             }
                //             ses.createCustomVerificationEmailTemplate(params, (err, data) => {
                //                 if (err)
                //                     throw new Error("Email template creation failed. " + err);
                //                 else
                //                     resolve(addedUser);
                //             });
                //         })
                //             .catch(error => generateResponse(false, error.message, [], error))
                //     } else
                //         throw new Error("User not created. Database issue.");
                // })
                //3 use the template to send the verify-email-id email
                /** Work in progress end */



                // sending verify email-id email
                .then(async addedUser => {
                    if (addedUser) {
                        return new Promise((resolve, reject) => {
                            /** sending verification email */
                            ses.verifyEmailAddress({ EmailAddress: addedUser.email }, (err, data) => {
                                if (err)
                                    throw new Error("Email verification mail failed. " + err);
                                else
                                    resolve(addedUser);
                            });
                        })
                            .catch(error => generateResponse(false, error.message, [], error))
                    } else
                        throw new Error("User not created. Database issue.");
                })
                .then(addedUser => {
                    console.log("reached signup success, here's the added user: ", addedUser);
                    if (addedUser)
                        return generateResponse(true, `User signed up successfully`, { username: addedUser.username }, []);
                    else
                        return generateResponse(false, `User sign up failed`, {}, []);
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
            else
                body.email = body.email.toLowerCase();

            if (!body.password || body.password.length < 5 || body.password.length > 127)
                return generateResponse(false, `Enter valid credentials.`, [], []);

            return User.findOne({ email: body.email })
                .then(fetchedUser => {

                    if (!fetchedUser)
                        throw new Error("Enter valid credentials.");

                    user = fetchedUser; /** user found */
                    return bcrypt.compare(body.password, user.password_hash); /** Verifying password */
                })
                .then(async passwordMatched => {
                    if (!passwordMatched)
                        throw new Error("Enter valid credentials.");

                    /** User is authenticated. 
                     * Check if the email is verified 
                     * If user is verified, proceed to create jwt and provide access
                     * If user not verified, then 1.) check aws-ses for the same and 2.) update the status in the db 
                    */
                    if (user.verified)
                        return user.verified;

                    else {
                        return new Promise((resolve, reject) => {
                            ses.listIdentities({ IdentityType: 'EmailAddress' }, (err, data) => {
                                if (err)
                                    throw new Error("No identities found. " + err);
                                else {
                                    const identities = data.Identities;
                                    resolve(identities);
                                }
                            });
                        })
                            .then(async identities => {
                                if (identities && identities.includes(user.email)) {

                                    return new Promise((resolve, reject) => {
                                        ses.getIdentityVerificationAttributes({ Identities: [user.email] }, (err, data) => {
                                            if (err)
                                                throw new Error("No identity data found. " + err);
                                            else {
                                                console.log("emailVerified status: ", data.VerificationAttributes[user.email].VerificationStatus);
                                                console.log("typeof emailVerified status: ", typeof data.VerificationAttributes[user.email].VerificationStatus);
                                                let emailVerified = false;

                                                if (data && data.VerificationAttributes && data.VerificationAttributes[user.email] && data.VerificationAttributes[user.email].VerificationStatus && data.VerificationAttributes[user.email].VerificationStatus === `Success`)
                                                    emailVerified = true;
                                                else
                                                    throw new Error("Please verify your email ID!");

                                                resolve(emailVerified);
                                            }
                                        });
                                    })
                                        .catch(error => generateResponse(false, error.message, [], error))
                                } else
                                    throw new Error("No identity data found!");
                            })
                            .then((emailVerified) => {
                                /** if email is verified, update it in db. If it is not verified, don't do anything */
                                if (emailVerified) {
                                    return User.findOneAndUpdate({ email: user.email }, { verified: true }, { new: true })
                                        .then(updatedUser => {
                                            if (updatedUser)
                                                return updatedUser.verified;
                                            else
                                                throw new Error("Updating user's verify status failed!");
                                        })
                                        .catch(error => generateResponse(false, error.message, [], error))
                                }
                                else
                                    return emailVerified; /** not verified */
                            })
                            .catch(error => generateResponse(false, error.message, [], error))
                    }
                })
                .then((emailVerified) => {

                    console.log("emailVerified: ", emailVerified);
                    const data = {
                        username: user.username
                    };
                    if (emailVerified) {
                        /** Create JWT token */
                        const payload = {
                            user: {
                                id: user.id
                            }
                        };
                        const jwtToken = jwt.sign(payload, JWT_SECRET);
                        data.jwtToken = jwtToken;
                        data.freeRequestsBalance = freeRequestsLimit - user.queryCount;

                    } else
                        data.verified = emailVerified;

                    return generateResponse(true, `User logged in successfully!`, data, []);
                })
                .catch(error => generateResponse(false, error.message, [], error))
        } else
            return generateResponse(false, `Invalid data`, [], error);

    } catch (error) {
        return generateResponse(false, `Internal Server Error`, [], error);
    }
}


module.exports = { createUser, logInUser };