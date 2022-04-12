const mongoose = require('mongoose')
const validator = require('validator')
const Category = require('./category')

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
    },

    ingredients: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    picture: {
        type: Buffer
    },

    picture_name: {
        type: String,
    },

    picture_url: {
        type: String
    },

    prod_categories: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: Category,
            }
        }
    ]
}, {
    timestamps: true
})

productSchema.methods.toJSON = function () {
    const product = this
    const productObject = product.toObject()
    delete productObject.picture
    return productObject
}

productSchema.methods.setCategories = async function (reqBodyCategories) {
    const product = this
    // split the categories in parts which seperated by ,
    const reqCatgs = reqBodyCategories.split(',')
    // console.log('req cat is : ', reqCatgs)
    // Assign these value to product categories array
    reqCatgs.forEach(reqCat => {
        // console.log(reqCat)
        // console.log(product.prod_categories)
        //console.log(product.prod_categories.some(category => category.category.toHexString() === reqCat))
        if (!product.prod_categories.some(category => category.category.toHexString() === reqCat)) {
            product.prod_categories.push({ category: reqCat })
        }
        //console.log(product.prod_categories)
    })
    await product.save()
    // console.log(product)
}


productSchema.methods.deleteCategories = async function () {
    const product = this
    product.prod_categories = []
    await product.save()
}
const Product = mongoose.model('Product', productSchema)
module.exports = Product