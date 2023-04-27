const { createUser } = require('./controllers/auth');
const { makeRequest } = require('./controllers/query');
const fetchUser = require('./middleware/fetchUser');

const dotenv = require('dotenv');
dotenv.config();

const connectToMongo = require('./db');
connectToMongo();

// const port = 5000;

// const headers = {
//   "Access-Control-Allow-Methods": "OPTIONS, POST, GET, PUT, DELETE",
//   "Access-Control-Allow-Credentials": true,
//   "Access-Control-Allow-Headers": "Content-Type",
// };

// const cookieParser = require('cookie-parser');
// app.use(cookieParser());
// const cookie = require('cookie');

module.exports.signupHandler = async (req) => {

  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers["origin"]
  };
  // headers["Access-Control-Allow-Origin"] = req.headers["origin"];

  // req.cookies = cookie.parse(req.headers.Cookie || '');
  // console.log("this one here", req);

  /** Handle preflight request */
  if (req.httpMethod === "OPTIONS") {
    return {
      statusCode: "204",
      headers,
      body: JSON.stringify({})
    };
  }

  const response = await createUser(req);
  return response;
};

// module.exports.loginHandler = async (req) => {
//   // handle the logic for the /login endpoint
//   const requestBody = JSON.parse(req.body);
//   // authenticate the user using the request body
//   return {
//     statusCode: 200,
//     body: JSON.stringify({ message: "User logged in successfully" }),
//   };
// };

module.exports.queryHandler = async (req) => {

  const headers = {
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers["origin"]
    // "Access-Control-Allow-Origin": "chrome-extension://akmkcicklllnibehnoeikjfihhlpcoio"
  };
  // headers["Access-Control-Allow-Origin"] = req.headers["origin"];

  /** Handle preflight request */
  if (req.httpMethod === "OPTIONS") {
    // headers["Access-Control-Allow-Headers"] = "Content-Type, qm_Token, Authorization, X-Amz-Date, X-Amz-Security-Token, X-Api-Key";
    return {
      statusCode: "204",
      headers,
      body: JSON.stringify({})
    };
  }

  req.userId = fetchUser(req);

  return makeRequest(req)
    .then(response => {
      console.log("bot response here: ", response);
      return response;
    })
    .catch(error => console.log(error))

};
