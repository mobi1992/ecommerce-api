const mongoose = require('mongoose')
//connecting to the database, mongoose uses the mongodb behind the scene 
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser : true })
