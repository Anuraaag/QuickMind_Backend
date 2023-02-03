const xss = require("xss");
const generateResponse = require("../helpers/response");

const sanitizeQuery = (req, res, next) => {

    try {
        if (req.body.query) {
            /** Removing any unwanted/unsecure tags from the query */
            req.body.query = xss(req.body.query);
            next();
        }
        else {
            res.status(401).send(generateResponse(false, `No query found!`, [], []));
        }
    }
    catch (error) {
        res.status(401).send(generateResponse(false, `Something seems off!`, [], []));
    }
}

module.exports = sanitizeQuery;