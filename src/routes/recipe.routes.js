import express from 'express'
import authController from '../controllers/auth.controller'
import recipeController from '../controllers/recipe.controller';
import multer from 'multer'

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.route('/api/recipe')
     .get(recipeController.findAll)
     .post(authController.checkSignin, upload.single('image'), recipeController.create)

router.route('/api/recipe/:recipe_id')
     .get(authController.checkSignin, recipeController.read)

router.param('recipe_id', recipeController.recipeById);

export default router