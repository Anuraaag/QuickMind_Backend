const { createUser, logInUser } = require('./controllers/auth');
const { makeRequest } = require('./controllers/query');
const fetchUser = require('./middleware/fetchUser');
const generateResponse = require("./helpers/response");

const dotenv = require('dotenv');
dotenv.config();

const connectToMongo = require('./db');
connectToMongo();

// const headers = {
//   "Access-Control-Allow-Methods": "OPTIONS, POST, GET, PUT, DELETE",
//   "Access-Control-Allow-Credentials": true,
//   "Access-Control-Allow-Headers": "Content-Type",
// };

module.exports.signupHandler = async (req) => {

  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers["origin"]
  };

  /** Handle preflight request */
  if (req.httpMethod === "OPTIONS")
    return {
      statusCode: "204",
      headers,
      body: JSON.stringify({})
    };

  return createUser(req)
    .then(response => response)
    .catch(error => generateResponse(false, `Internal Server Error`, [], error))
};

module.exports.loginHandler = async (req) => {

  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers["origin"]
  };

  /** Handle preflight request */
  if (req.httpMethod === "OPTIONS")
    return {
      statusCode: "204",
      headers,
      body: JSON.stringify({})
    };

  return logInUser(req)
    .then(response => response)
    .catch(error => generateResponse(false, `Internal Server Error`, [], error))
};

module.exports.queryHandler = async (req) => {

  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers["origin"]
    // "Access-Control-Allow-Origin": "chrome-extension://akmkcicklllnibehnoeikjfihhlpcoio"
  };

  /** Handle preflight request */
  if (req.httpMethod === "OPTIONS")
    return {
      statusCode: "204",
      headers,
      body: JSON.stringify({})
    };

  req.user = fetchUser(req);

  if (req.user && req.user.id) {
    return makeRequest(req)
      .then(response => response)
      .catch(error => generateResponse(false, `Internal Server Error`, [], error))
  }
  else
    return req.user; /** it's the error response from fetchUser and not the 'user' in this case */

};
