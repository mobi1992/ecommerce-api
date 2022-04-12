const Category = require('../models/category')
const express = require('express')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const Product = require('../models/product')

router.post('/categories', async (req, res) => {
    const category = new Category(req.body)
    try {
        await category.save()
        res.status(201).send({ category })
    }
    catch (err) {
        res.status(400).send(err)
    }
})

router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({})
        res.send({ categories })
    }
    catch (err) {
        res.status(500).send({ error: 'Internal server error!' })
    }
})

router.get('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
        res.send({ category })
    }
    catch (err) {
        res.status(500).send({ error: 'Internal server error!' })
    }
})

router.get('/CategoryProducts/:id', async (req, res) => {
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
        const catg = await Category.findById(req.params.id)
        // console.log(catg)
        if(!catg) {
            res.status(404).send({error : 'Category not found'})
        }
        const products = await Product.find({"prod_categories.category" : catg._id}, null, {
            limit : parseInt(req.query.limit),
            skip : parseInt(req.query.skip),
            sort
        })
        res.send({products})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({error : 'Internal server error!'})
    }
})
router.delete('/categories/:id', async (req, res) => {
    try {
        const catg = await Category.findByIdAndDelete(req.params.id)
        if (!catg) {
            return res.status(404).send({ error: 'Category not found' })
        }
        console.log(catg._id)

        // delete the category_id from the product's prod_categories array, when the specific category is deleted
        // const products = await Product.updateMany({ $pull: { prod_categories: { category: catg._id } } })
        
        // or delete all the products which have that category, you can take any approach
        const products = await Product.deleteMany({"prod_categories.category" : catg._id})
        res.send({ catg })
    }
    catch (err) {
        res.status(500).send({ error: 'Internal server error!' })
    }
})

router.patch('/categories/:id', async (req, res) => {
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update!' })
    }

    try {
        const category = await Category.findOne({ _id, new: true, runValidators: true })
        updates.forEach(update => {
            // we will use bracket notation to dynamically update the properties on user
            category[update] = req.body[update]
        })
        await category.save()    // this is where our middleware will be completed

        if (!category) {
            return res.status(404).send('Category not found')
        }
        res.send(category)
    }
    catch (err) {
        res.status(400).send(err)
    }
})
module.exports = router
