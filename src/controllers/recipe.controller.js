import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import Recipe from '../models/recipe.model.js'
import User from '../models/user.model.js'
import extend from 'lodash/extend.js'

const recipeProjections = {
  '_id': false,
  '__v': false
}

const findAll = async (req, res) => {
  try {
    const limit = req.query.limit != null ? req.query.limit : 0;

    let result = (await Recipe.find({}, recipeProjections).limit(limit));

    result = modifyResult(result);

    return res.status(200).json({result})
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const create = async (req, res) => {
  try {
    var buffer = Buffer.from(req.body.image, 'base64')

    let newRecipe = {
      ...req.body,
      recipe_id: generator.generateId(8),
      posted_by: req.auth,
      image: {
        data: buffer,
        contentType: 'img/jpeg'
      },
      rating: []
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
    let recipe = await Recipe.findOne({id: req.params.id}, recipeProjections);
    recipe = modifyResult([recipe]);

    return res.status(200).json(recipe[0])
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

const modifyResult = (recipe) => {
  let res = recipe.map(item => {
    let base64Image = item.image.data.toString('base64');
    var averageRating = 0;

    if(item.rating.length > 0){
      let totalRating = item.rating.reduce((sum, rating) => sum + rating.rating, 0);
      averageRating = totalRating / item.rating.length;
    }

    return {
      ...item._doc,
      rating: averageRating,
      image: base64Image
    }
  });

  return res;
}

const recipeByUser = async (req, res) => {
  try {
    let userCreatedRecipe = await Recipe.find({posted_by: req.auth._id}, recipeProjections);
    let userSavedRecipe = await User.findOne({_id: req.auth._id}).populate('saved_recipe');

    console.log(userSavedRecipe);

    let recipe = {
      saved : modifyResult(userSavedRecipe.saved_recipe),
      created: modifyResult(userCreatedRecipe)
    };

    return res.status(200).json(recipe);
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
  recipeById,
  recipeByUser,
}