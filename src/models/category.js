const mongoose = require('mongoose')
const validator = require('validator')
const Product = require('./product')

const categorySchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    }
})

// virtual property is not actual data stored in the database but it is a relationship between two entities in our case category and products under that category, first argument can be any name, for exp myProducts etc
categorySchema.virtual('products', {
    ref : 'Product',
    localField : '_id',   // where the local data is stored, in our case it is category id
    foreignField : 'prod_categories.category'   // where the foreign data is stored and in our case it is the prod_categories array in Product model
})

const Category = mongoose.model('Category' ,categorySchema)
module.exports = Category