const mongoose = require("mongoose");

const connectDB = async () => {
    try{
        const connect = await mongoose.connect(process.env.URI);
        console.log("MongoDB successfully connected.")
    }catch (err) { 
        console.log(err);
        process.exit(1); 
    }
}

module.exports = connectDB;