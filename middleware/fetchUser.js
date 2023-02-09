const jwt = require("jsonwebtoken");
const JWT_SECRET = `${process.env.JWT_SECRET}`;
const generateResponse = require("../helpers/response");

const fetchUser = (req, res, next) => {

    try {
        const JWT = req.cookies.jwt_token; /** fetching jwt from the request header */

        if (!JWT) {
            res.status(401).send(generateResponse(false, `JWT missing`, [], []));
        }
        else {
            const payload = jwt.verify(JWT, JWT_SECRET);
            req.user = payload.user;
            next();
        }

    } catch (error) {
        res.status(401).send(generateResponse(false, `JWT missing`, [], []));
    }

}

module.exports = fetchUser;