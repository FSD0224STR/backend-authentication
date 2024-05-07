const { Router } = require("express");
const { addUser, getUsers, deleteUser, checkUser, isAuthenticated, getMyUserInfo, isAdmin } = require("../controllers/userController");

const userRouter = Router()

userRouter.post('/add', isAuthenticated, addUser)
userRouter.post('/login', checkUser)
userRouter.get('/', getUsers)
userRouter.get('/me', isAuthenticated, getMyUserInfo)
userRouter.delete('/:id', isAuthenticated, isAdmin, deleteUser)

module.exports = { userRouter };