import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import { expressjwt } from 'express-jwt'

// setup process.env
import dotenv from 'dotenv'
dotenv.config();

const jwtsecret = process.env.JWTSECRET

const signin = async (req, res, next) => {
  let user = await User.findOne({'username': req.body.username})

  if(!user || !user.authenticate(req.body.password)){
    return res.status(401).json({
      error: 'Username or password not match'
    })
  }

  const token = jwt.sign({
    _id: user._id
  }, jwtsecret, {
    algorithm: "HS256"
  })

  res.cookie("t", token, {
    expire: new Date() + 9999
  })

  return res.json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
    }
  })
}

const signout = async (req, res, next) => {
  res.clearCookie("t")
  return res.status(200).json({
    message: "Signed out"
  })
}

const checkSignin = expressjwt({
  secret: jwtsecret,
  algorithms: ["HS256"],
  userProperty: 'auth'
})

export default {
  signin,
  signout,
  checkSignin
}