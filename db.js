const mongoose = require('mongoose');

mongoUri = "mongodb://localhost:27017/Quickmind?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
// mongoUri = "mongodb+srv://AnuragGupta:The1%40ndonly%23%29@notenest.okifm.mongodb.net/NoteNest?retryWrites=true&w=majority";

const connectToMongo = () => {
    mongoose.connect(mongoUri, () => {
        console.log("connected to mongo");
    });
}

module.exports = connectToMongo;

