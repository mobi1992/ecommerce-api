// middleware runs before sending a respnse back to user
//     req   ====>   do something (middleware running)   =====>   sending response  
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const auth = async (req, res, next) => {
    try {
        // get the token from request header
        const token = req.header('Authorization').replace('Bearer ', '')  // we have to trim Bearer from the token, we can use trim methods on string as well but here we are using replace method, and replacing Bearer with an empty string
        // console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET)   //verfiy the token with the same key you hav provided in the user model
        // console.log(decoded)       // the output will be something like that { _id: '6237d9ee50dc3ece69f25fab', iat: 1647827438 }

       // check the tokens array if the token is still present in the array
        const user = await User.findOne({_id : decoded._id, 'tokens.token' : token})
        // console.log('User is', user)
        if (!user) {
            throw new Error()   // to trigger catch block
        }

        req.user = user     // add a property onto req to store user data
        req.token = token     // add a property onto req to store user token
        next()
    }
    
    catch(err) {
        res.status(401).send({error : 'Please Authenticate!'})
    }
}

module.exports = auth