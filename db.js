const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

// mongoUri = "mongodb://localhost:27017/Quickmind?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
mongoUri = "mongodb+srv://Anurag:zcf4ASsIgmP1NFOj@cluster0.csoqm2j.mongodb.net/Quickmind";

const connectToMongo = () => {
    mongoose.connect(mongoUri, () => console.log("connected to mongo"));
}

module.exports = connectToMongo;