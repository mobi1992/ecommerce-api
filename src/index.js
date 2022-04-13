const express = require('express')
require('./db/mongoose')
const app = express()
const productRouter = require('./routers/productRouter')
const categoryRouter = require('./routers/categoryRouter')
const cors = require('cors')
const port = process.env.PORT

// to parse the json so that it can become an object
app.use(express.json())

app.use(productRouter)
app.use(categoryRouter)
// to solve CORS policiy error when frontend tries to access our server
app.use(cors());
app.options("*", cors());

app.listen(port, () => {
    console.log('server is up at port ' + port)
})
