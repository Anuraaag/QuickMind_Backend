
const User = require('../models/User');
const { ObjectId } = require('mongodb');

const freeRequestsLimit = 30;

const dotenv = require('dotenv');
dotenv.config();

const API_URL = `${process.env.API_URL}`;
const API_KEY = `${process.env.API_KEY}`;

const generateResponse = require("../helpers/response");
const ai_model = `text-ada-001`;
// const ai_model = `text-davinci-003`;
// const ai_model = `text-curie-001`;
// const ai_model = `text-babbage-001`;

const xss = require("xss");

const makeRequest = async (req) => {

    try {

        const body = req.body ? JSON.parse(req.body) : null;
        const userId = req.user && req.user.id ? req.user.id : null;
        const updateQuery = userId ? { _id: new ObjectId(`${userId}`) } : null;

        let queryResponse = ``;

        if (body && updateQuery) {

            if (body.query)
                body.query = xss(body.query);
            else
                return generateResponse(false, `Your query is empty, I can't understand your silence...`)

            if (body.query.length > 2400)
                return generateResponse(false, `Oh that was a lot. Tell me in short please!`)

            /** Push the query to the db */
            return User.findOneAndUpdate(updateQuery, { $push: { queries: { query: body.query } } }, { new: true })

                .then(updatedUser => {

                    /** check the free request balance */
                    if (updatedUser.queryCount < freeRequestsLimit) {

                        /** process the query */
                        const query = `I'm using you to build my chatbot. I don't want your responses to let the user know that my chatbot uses ChatGPT. So, don't reveal that you are ChatGPT or that you are linked to OpenAI or any other company. And don't talk about or mention OpenAI if the query doesn't mention it. Now below is the user query that you have to respond to. 
                        Query: ${body.query}`;

                        // Make a request to the API
                        return fetch(API_URL, {
                            method: `POST`,
                            headers: {
                                "Content-Type": `application/json`,
                                "Authorization": `Bearer ${API_KEY}`,
                            },
                            body: JSON.stringify({
                                'model': ai_model,
                                'temperature': 0.7,
                                'max_tokens': 1000,
                                'prompt': query
                            }),
                        })
                            .then(response => response.json())
                            .then(async (queryResponse) => {

                                queryResponse = queryResponse.choices[0].text;

                                if (queryResponse) {
                                    /** Increment user's query count */
                                    const confirmUpdate = await User.findOneAndUpdate(updateQuery, { $inc: { queryCount: 1 } }, { new: true });
                                    const freeRequestsBalance = freeRequestsLimit - confirmUpdate.queryCount;
                                    return generateResponse(true, '', { queryResponse, freeRequestsBalance }, []);
                                }
                            })
                            .catch(error => generateResponse(false, `Internal Server Error`, [], error))

                    } else {
                        queryResponse = `Thank you for using my service! I'm glad you've found it useful. I want to let you know that you have exhausted the free version of this service, which allows for a limited number of queries. To continue using the same, I invite you to upgrade to the paid plan. The paid plan offers more queries, and custom query rate limits. You shall find the payment button below. Please reach out to me if you have any questions or if there's anything I can do to help. Email: anuraggupta.dev@gmail.com`;
                        return generateResponse(true, '', queryResponse, []);
                    }
                })
                .catch(error => generateResponse(false, `Internal Server Error`, [], error))

        } else
            return generateResponse(false, `JWT missing`, [], []);
    }
    catch (error) {
        console.log(error);
        return generateResponse(false, `Internal Server Error`, [], error);
    }
}

module.exports = { makeRequest };
