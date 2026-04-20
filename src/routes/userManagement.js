import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as userManagementController from '../controllers/userManagement.controller.js'

const router = Router()

// All user management routes require admin authentication
router.use(requireAuth, requireAdmin)

router.get('/', userManagementController.getAllUsers)
router.get('/:userId', userManagementController.getUserById)
router.patch('/:userId/block', userManagementController.blockUser)
router.patch('/:userId/unblock', userManagementController.unblockUser)
router.patch('/:userId/role', userManagementController.updateUserRole)
router.delete('/:userId', userManagementController.deleteUser)

export default router
