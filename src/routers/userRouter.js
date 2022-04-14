const User = require('../models/user')
const express = require('express')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const auth =  require('../middleware/auth')
const cors = require('cors')


router.use(cors())
router.options('*', cors())

router.post('/users', async(req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user})
    }
    catch(err) {
        console.log(err)
        res.status(400).send(err)
    }
})

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({user, token})
    }
    catch(err) {
        res.status(400).send({error : 'Invalid username or password'})
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()
        res.send('Logout successfully')
    }
    catch(err) {
        console.log(err)
        res.status(500).send({error : 'Internal server error!'})
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        // wipe out all the tokens
        req.user.tokens = []
        await req.user.save()
        res.send('Logout from all devices successfully ')
    }
    catch (err) {
        res.status(500).send('Internal server Error!')
    }
})

module.exports = router
