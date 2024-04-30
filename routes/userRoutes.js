const { Router } = require("express");
const { addUser, getUsers, deleteUser, checkUser, isAuthenticated, getMyUserInfo, isAdmin } = require("../controllers/userController");

const userRouter = Router()

userRouter.post('/register', addUser)
userRouter.post('/login', checkUser)
userRouter.get('/', isAuthenticated, isAdmin, getUsers)
userRouter.get('/quiensoy', isAuthenticated, getMyUserInfo)
userRouter.delete('/:id', isAuthenticated, deleteUser)

module.exports = { userRouter };