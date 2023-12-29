import User from '../models/user.model.js'
import errorHandler from '../helpers/dbErrorHandler.js'
import extend from 'lodash/extend.js'

const userProjections = {
  '_id': false,
  '__v': false,
  'hashed_password': false,
  'salt': false
}

const create = async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save()
    return res.status(200).json({
      message: 'Successfully signed up'
    })
  } catch (err){
    let error;
    if(err.code == 11000){
      error = 'Email already exists';
    } else {
      error = errorHandler.getErrorMessage(err)
    }

    return res.status(500).json({error});
  }
}

const read = async (req, res) => {
  const user = await User.findOne({username : req.params.username}, userProjections)

  return res.status(200).json(user)
}

const update = async (req, res) => {
  try {
    let user = req.profile

    if(req.body.profile){
      let buffer = Buffer.from(req.body.profile, 'base64')
      req.body.profile = {};
      req.body.profile.data = buffer;
      req.body.profile.contentType = 'img/jpeg';
    }

    user = extend(user, req.body)
    await user.save()
    user.hashed_password = undefined
    user.salt = undefined
    res.json(user)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const userByEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({email: req.params.email})
    req.profile = user
    next()
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err)
    })
  } 
}



export default {
  create,
  read,
  update,
  userByEmail
}