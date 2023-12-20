import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import Recipe from '../models/recipe.model.js'
import extend from 'lodash/extend.js'

const recipeProjections = {
  '_id': false,
  '__v': false
}

const findAll = async (req, res) => {
  try {
    const limit = req.query.limit != null ? req.query.limit : 0;

    const result = await Recipe.find({}, recipeProjections).limit(limit);

    return res.status(200).json({result})
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const create = async (req, res) => {
  try {
    let newRecipe = {
      recipe_id: generator.generateId(8),
      posted_by: req.auth,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      },
      ...req.body
    }

    const recipe = new Recipe(newRecipe)
    await recipe.save()

    return res.status(200).json({
      messages: 'Recipe successfully posted',
    })

  } catch (err){
    console.log('error details:')
    console.log(err)
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const read = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({id: req.params.id}, recipeProjections)
    return res.status(200).json(recipe)
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const recipeById = async (req, res, next, id) => {
  try {
    const recipe = await Recipe.findOne({id})
    req.recipe = recipe
    next()
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

export default {
  findAll,
  create,
  read,
  recipeById
}