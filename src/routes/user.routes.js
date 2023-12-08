import express from 'express'
import userCtrl from '../controllers/user.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/users')
      .post(userCtrl.create)

router.route('/api/users/:userid')
      .get(authCtrl.checkSignin, userCtrl.read)
      .put(authCtrl.checkSignin, userCtrl.update)

router.param('userid', userCtrl.userById)

export default router;