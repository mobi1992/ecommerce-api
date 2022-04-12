const Product = require('../models/product')
const Category = require('../models/category')
const express = require('express')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')


const upload = multer({
    // dest : 'avatars',
    // to limit the size of file being uploaded
    limits: {
        fileSize: 2000000    // 1MB
    },
    fileFilter(req, file, cb) {     // cb is for callback
        // we are gonna use a regular expression for checking that the image file with .png .jpg .jpeg extentions can get uploaded
        // you can go to https://regex101.com to check and verify your regular expressions
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            // In case of error
            cb(new Error('Please upload an image.'))
        }

        // create a new property on req object for filename
        req.filename = file.originalname
        console.log(req.filename)
        // In case of successful upload, error is undefined and second arg is true which presents successful upload
        cb(undefined, true)
        // if the upload is rejected
        // cb(undefined, false)
    }
})
router.post('/products', upload.single('picture'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ height: 300, width: 300 }).png().toBuffer()
    req.body.picture = buffer
    req.body.picture_name = req.filename
    // console.log(req.body)
    if (process.env.PORT) {
        req.body.picture_url = req.hostname + ':' + process.env.PORT + '/product/' + req.body.picture_name
        // console.log(req.body.picture_url)
    }
    else {
        req.body.picture_url = req.hostname + process.env.PORT + '/product/' + req.body.picture_name
        // console.log(req.body.picture_url)
    }
    const product = new Product(req.body)
    // console.log(req.body)
    await product.setCategories(req.body.categories)
    try {
        await product.save()
        res.status(201).send({ product })
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})

// get all products if no query parameter is passed
// get /products?limit=3&skip=1
// get /products?sortBy=createdAt_desc  or  _asc
// get /products?sortProducts=price_desc  or  _asc
router.get('/products', async (req, res) => {
    const sort = {}
    // sort products based on the createdAt time, old to new or new to old
    if(req.query.sortBy){
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1      // check the condition parts[1] === 'desc' if it is true then set the property on sort sort[parts[0]] equal to -1 otherwise 1
    }

    // sort products based on prices
    if(req.query.sortProducts) {
        const parts = req.query.sortProducts.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        const products = await Product.find(null, null, {
            limit : parseInt(req.query.limit),
            skip : parseInt(req.query.skip),
            sort
        })
        res.send({ products })
    }
    catch (err) {
        res.status(500).send({ error: 'Internal server error!' })
    }
})

router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        res.send({ product })
    }
    catch (err) {
        res.status(500).send({ error: 'Internal server error!' })
    }
})

router.get('/product/:picture_name', async (req, res) => {
    try {
        console.log(req.params.picture_name)
        const product = await Product.findOne({ picture_name: req.params.picture_name })

        if (!product || !product.picture) {
            throw new Error('Pic not found')
        }

        res.set('Content-type', 'image')   // for all image type uploads
        res.set('Content-type', 'image/png')   // for the png image uploads
        res.send(product.picture)
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err.message)
    }
})

router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id)
        if (!product) {
            return res.status(404).send({ error: 'Product not found!' })
        }
        res.send({ product })
    }
    catch (err) {
        res.status(500).send({ error: 'Internal Server error!' })
    }
})

router.delete('/products', async (req, res) => {
    try {
        const products = await Product.deleteMany({})
        if (!products) {
            return res.status(404).send({ error: 'Products not found!' })
        }
        res.send({ products })
    }
    catch (err) {
        // console.log('Error is' + err)
        res.status(500).send({ error: 'Internal Server error!' })
    }
})

router.delete('/productCategories/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).send({error : 'Product not found!'})
        }
        await product.deleteCategories()
        res.send({product})
    }
    catch(err) {
        res.status(500).send({error : 'Internal server error!'})
    }
})

router.patch('/products/:id', upload.single('picture'), async (req, res) => {
    const _id = req.params.id
    if(req.file
        ) {
        const buffer = await sharp(req.file.buffer).resize({ height: 300, width: 300 }).png().toBuffer()
    req.body.picture = buffer
    req.body.picture_name = req.filename
    if (process.env.PORT) {
        req.body.picture_url = req.hostname + ':' + process.env.PORT + '/product/' + req.body.picture_name
        console.log(req.body.picture_url)
    }
    else {
        req.body.picture_url = req.hostname + process.env.PORT + '/product/' + req.body.picture_name
        console.log(req.body.picture_url)
    }
    }
    
    console.log(req.body)

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'ingredients', 'description', 'price', 'picture', 'picture_name', 'picture_url', 'categories']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update!' })
    }
    try {
        const product = await Product.findOne({ _id, new: true, runValidators: true })
        if (!product) {
            return res.status(404).send('Product not found')
        }

        updates.forEach(update => {
            // we will use bracket notation to dynamically update the properties on user
            product[update] = req.body[update]
            //console.log(req.body[update])
        })

        if (req.body.categories) {
            await product.setCategories(req.body.categories)
        }
        await product.save()    // this is where our middleware will be completed

        res.send(product)
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})

module.exports = router
