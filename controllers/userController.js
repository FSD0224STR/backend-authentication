const { userModel } = require("../models/User.model")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const myTokenSecret = process.env.MYTOKENSECRET;

const getUsers = async (req, res) => {
    console.log('req.user en getusers', req.user)
    const data = await userModel.find();
    res.json(data)
}

const addUser = async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)  
    console.log('vamos a ver', hashedPassword)
    try {
        const docInDb = await userModel.create({name: req.body.name, password: hashedPassword, role: req.body.role})
        res.json(docInDb)
    } catch (error) {
        res.status(500).json(error.errorResponse.errmsg)
    }
}

const checkUser = async (req, res) => {
    // lo primero vamos a buscar si existe un user con ese name
    const userFound = await userModel.findOne({ name: req.body.name })
    console.log(' a ver que es lo que devuelve la db', userFound)
    if (!userFound) return res.status(404).json('el usuario no existe')
    // si el user existe, vamos a ver si la contraseña coincide
    console.log(' a ver que devuelve esto del bcrypt compare', await bcrypt.compare(req.body.password, userFound.password))
    if (await bcrypt.compare(req.body.password, userFound.password)) {
        // ahora que todo coincide, te genero un token que usarás en el resto de llamadas
        console.log('myTokenSecret', myTokenSecret)
        const token = jwt.sign({id: userFound._id, name: userFound.name, role: userFound.role}, myTokenSecret, {expiresIn: 600})
        return res.status(200).json(token)
    }
    return res.json('no logueado, revisa la contraseña')
}

const isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    try {
        const decodedToken = jwt.verify(token, myTokenSecret)
        console.log('a ver que es esto de token decodificado', decodedToken)
        req.user = decodedToken;
        next()
    } catch (error) {
        res.status(404).json(error)
    }
}

const isAdmin = (req, res, next) => {
    if (req.user.role === 'admin') return next()
    res.status(400).json('No estas autorizado para ver este recurso')
}


const getMyUserInfo = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, myTokenSecret)
    const userFound = await userModel.findById(decodedToken.id)
    // res.json(userFound)
    res.json({...userFound._doc, password: 'esto no te lo puedo enseñar'})
}

const deleteUser = async (req, res) => {
    // if (req.user.id !== req.params.id) return res.status(400).json('No puedes borrar a alguien que no sea tu propio user')
    try {
        const data = await userModel.findByIdAndDelete(req.params.id)
        if (data) return res.json('borrado')
        res.status(404).json('no se ha encontrado ningun elemento con ese id')
    } catch (error) {
        res.status(500).json(error)
    }
}

module.exports = { getUsers, addUser, deleteUser, checkUser, isAuthenticated, getMyUserInfo, isAdmin }

