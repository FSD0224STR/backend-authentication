const { userModel } = require("../models/User.model")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const welcomeEmail = `<!DOCTYPE html>
<html>
<head>
    <title>My Blog</title>
    <style>
        /* CSS styles for the navbar */
        .navbar {
            background-color: #333;
            color: #fff;
            padding: 10px;
        }
        
        .navbar a {
            color: #fff;
            text-decoration: none;
            margin-right: 10px;
        }
        
        /* CSS styles for the articles */
        .article {
            margin-bottom: 20px;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .article h2 {
            color: #333;
        }
        
        .article p {
            color: #666;
        }
        
        .article img {
            max-width: 100%;
            height: auto;
            margin-bottom: 10px;
        }
    </style>
    <scrip>
</head>
<body>
    <div class="navbar">
        <a href="#">Home</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
    </div>
    
    <div class="article">
        <h2>Article 1</h2>
        <img src="https://www.cats.org.uk/media/13136/220325case013.jpg?width=500&height=333.49609375" alt="Image 1">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc id aliquet lacinia, nunc nunc ultrices nisl, vitae lacinia nunc nunc auctor nunc. Sed euismod, nunc id aliquet lacinia, nunc nunc ultrices nisl, vitae lacinia nunc nunc auctor nunc.</p>
    </div>
    
    <div class="article">
        <h2>Article 2</h2>
        <img src="image2.jpg" alt="Image 2">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc id aliquet lacinia, nunc nunc ultrices nisl, vitae lacinia nunc nunc auctor nunc. Sed euismod, nunc id aliquet lacinia, nunc nunc ultrices nisl, vitae lacinia nunc nunc auctor nunc.</p>
    </div>
    
    <!-- Add more articles here -->
    
</body>
</html>
`;

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "asociacionhorcajodelaribera@gmail.com",
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

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
        const docInDb = await userModel.create({name: req.body.name, password: hashedPassword, role: req.body.role, email: req.body.email})
        // send confirmation email
        const email = {
            from: "asociacionhorcajodelaribera@gmail.com",
            to: docInDb.email,
            subject: "Hello from Clase",
            text: "This is a test email sent using Nodemailer.",
            html: `<h!>Bienvenido a nuestra web</h1> <p>Link para completar tu registro <a>http://localhost:5173/confirmregister/${docInDb._id}</a></p>`
        };
        transporter.sendMail(email, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        })
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
        const token = jwt.sign({id: userFound._id, name: userFound.name, role: userFound.role, email: userFound.email}, myTokenSecret, {expiresIn: 600})
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
        // enviar email de confirmación de borrado al ejecutor
        const email = {
            from: "asociacionhorcajodelaribera@gmail.com",
            to: req.user.email,
            subject: "Hello from Clase hemos borrado",
            text: "This is a test email to tell you we've removed the user bla bla.",
        };
        transporter.sendMail(email, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        })
        if (data) return res.json('borrado')
        res.status(404).json('no se ha encontrado ningun elemento con ese id')
    } catch (error) {
        res.status(500).json(error)
    }
}

const confirmUser = async (req, res) => {
    const userFound = await userModel.findById(req.params.id)
    if (!userFound) return res.status(404).json('no existe ese usuario')
    userFound.confirmed = true;
    await userFound.save()
    res.json('usuario confirmado')
}

module.exports = { getUsers, addUser, deleteUser, checkUser, isAuthenticated, getMyUserInfo, isAdmin, confirmUser }

