const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// mongoose converts the object into schema, so in order to take advantage of the middleware we have to convert the object into schema and the pass it to the mongoose.model

// add another object to schema to enable more options like time stamps
const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        // To trim the spaces around the name
        trim : true
    },
    email : {
        type : String,
        // emails shoudl be unique so that we can successfully login users
        unique : true,
        required : true,
        trim : true,
        lowercase : true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },

    password : {
        type : String,
        required : true,
        minLength : 7,
        trim : true,
        validate(value) {
            if(value.toLowerCase().includes("password")) {
                throw new Error('Password cannot contain "password".')
            }
        }
    },

    tokens : [
        {
            token : {
                type : String,
                required : true
            }
        }
    ],
}, 
{
    timestamps : true
})

// statics is on user model, this binding is not important here so we can use an arrow function
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })   //email : email 
    if(!user){
        throw new Error('Email is incorrect!')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch){
        throw new Error('Password is incorrect!')
    }
    // return the user if email and password matches
    return user
}

// the methods are on user instances, so this binding is important here, that is why we will use a standard function here
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id : user._id.toString()}, process.env.JWT_SECRET)
    // save the user to add the token in the tokens array, we will use the concat method to add a new token in the tokens array

    user.tokens = user.tokens.concat({token})     // object with token property equla to token  token:token, so we will use the shorthand syntax
    await user.save()
    return token
}

// Hiding private data, like tokens array and password, toJSON method will be called no matter we call it explicity or not
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject     // this userObject will be sent to the client, which does not contain password or tokens array
}
//Hash the plan text password before saving
// now we can apply middleware to the schema, middleware has 2 methods, one is pre (that means do something before saving a user) and the other is post (that means do something after saving the user), we will use pre and the method we will use is save
userSchema.pre('save', async function(next) {   // you cannot use arrow fucntion here as this binding plays impt role here
 // this here gives access to the individual user that is about to be saved 
 const user = this
 
 // if the password is created for the first time in post req or is being modified in patch req
 if (user.isModified('password')) {
     user.password = await bcrypt.hash(user.password, 8)   // hashed password is overwriting the plain rext password of the user
 }
 console.log('Just before saving')
 // we simply call next when we are done
 next()
})

const User = mongoose.model('User', userSchema)

module.exports = User