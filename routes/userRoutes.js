const { Router } = require("express");
const { addUser, getUsers, deleteUser, checkUser, isAuthenticated, getMyUserInfo, isAdmin, confirmUser } = require("../controllers/userController");

const userRouter = Router()

userRouter.post('/add', addUser)
userRouter.post('/login', checkUser)
userRouter.get('/', getUsers)
userRouter.get('/me', isAuthenticated, getMyUserInfo)
userRouter.delete('/:id', isAuthenticated, isAdmin, deleteUser)
userRouter.patch('/confirm/:id', confirmUser)

module.exports = { userRouter };