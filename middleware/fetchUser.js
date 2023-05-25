const jwt = require("jsonwebtoken");

const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = `${process.env.JWT_SECRET}`;

const generateResponse = require("../helpers/response");

const fetchUser = req => {

    try {
        if (req.headers && req.headers.qm_token) {

            const JWT = req.headers.qm_token;
            if (!JWT)
                return generateResponse(false, `JWT missing`, [], []);

            else {
                /** In case, a record is deleted from the db (say, manually), this will still interpret the data from the valid JWT */
                const payload = jwt.verify(JWT, JWT_SECRET);
                return payload.user;
            }
        }
        return generateResponse(false, `JWT missing`, [], []);

    } catch (error) {
        return generateResponse(false, `JWT missing`, [], error);
    }

}

module.exports = fetchUser;
