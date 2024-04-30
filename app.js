require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000

const { userRouter } = require('./routes/userRoutes')

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_CONNECTION_STRING)
.then(() => console.log('conectado a la db'))
.catch(() => console.log('vaya ha habido un error'))


app.use(cors())
app.use(express.json()) // esto hace que entiendas los req.body que vienen como json

app.use('/users', userRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})