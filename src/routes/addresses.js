import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { deleteMyAddress, getMyAddresses, postMyAddress } from '../controllers/addresses.controller.js'

const router = Router()

router.get('/', requireAuth, getMyAddresses)
router.post('/', requireAuth, postMyAddress)
router.delete('/:addressId', requireAuth, deleteMyAddress)

export default router

