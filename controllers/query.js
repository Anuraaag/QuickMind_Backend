const express = require('express');
const router = express.Router();

const User = require('../models/User');

const { body, validationResult } = require('express-validator');

const fetchUser = require("../middleware/fetchUser");
const sanitizeQuery = require("../middleware/sanitizeQuery");

const freeRequestsLimit = 25;

const apiUrl = `${process.env.API_URL}`;
const apiKey = `${process.env.API_KEY}`;

const generateResponse = require("../helpers/response");
const ai_model = `text-ada-001`;
// const ai_model = `text-davinci-003`;
// const ai_model = `text-curie-001`;
// const ai_model = `text-babbage-001`;

/** Process a query - /api/query/make
 * first argument has the path,
 * second arg contains the rules, 
 * third implements the body
*/
router.post('/make', fetchUser, sanitizeQuery, [
    body('query', 'Please elaborate. ..').isLength({ min: 1 }),
    body('query', 'Please limit your query to 2400 characters').isLength({ max: 2400 }),
], async (req, res) => {
    try {

        let queryResponse = ``;
        let message = ``;

        /** Checking for errors based on aforementioned rules */
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json(generateResponse(false, errors.array()[0].msg, [], errors.array()));

        /** Push the query to the db */
        const updatedUser = await User.findOneAndUpdate(req.user, { $push: { queries: { query: req.body.query } } }, { new: true });

        /** check the free request balance */
        if (updatedUser.queryCount < freeRequestsLimit) {

            /** process the query */
            const query = `I'm using you to build my chatbot. I don't want your responses to let the user know that my chatbot uses ChatGPT. So, don't reveal that you are ChatGPT or that you are linked to OpenAI or any other company. And don't talk about or mention OpenAI if the query doesn't mention it. Now below is the user query that you have to respond to. 
            Query: ${req.body.query}`;

            // Make a request to the API
            await fetch(apiUrl, {
                method: `POST`,
                headers: {
                    "Content-Type": `application/json`,
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    'model': ai_model,
                    'temperature': 0.7,
                    'max_tokens': 1000,
                    'prompt': query
                }),
            })
                .then(response => {
                    return response = response.json();
                })
                .then(async (queryResponse) => {

                    queryResponse = queryResponse.choices[0].text;
                    if (queryResponse.length) {
                        /** Increment user's query count */
                        const confirmUpdate = await User.findOneAndUpdate(req.user, { $inc: { queryCount: 1 } }, { new: true });
                        message = `Requests left: ${freeRequestsLimit - confirmUpdate.queryCount}`;
                        res.json(generateResponse(true, message, queryResponse, []));
                    }
                })
                .catch(error => console.log('error', error));
        }
        else {
            queryResponse = `Thank you for using my service! I'm glad you've found it useful. I want to let you know that you have exhausted the free version of this service, which allows for a limited number of queries. To continue using the same, I invite you to upgrade to the paid plan. The paid plan offers more queries, and custom query rate limits. You shall find the payment button below. Please reach out to me if you have any questions or if there's anything I can do to help. Email: anuraggupta.dev@gmail.com`;
            res.json(generateResponse(true, message, queryResponse, []));
        }

    } catch (error) {
        console.log(error);
        res.status(500).send(generateResponse(false, `Internal Server Error`, [], []));
    }
});

module.exports = router;