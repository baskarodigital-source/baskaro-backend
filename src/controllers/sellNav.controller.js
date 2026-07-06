import * as sellNavService from '../services/sellNav.service.js'

export async function getMegaMenu(req, res) {
  const data = await sellNavService.getSellNavMegaMenu()
  res.json({ success: true, message: 'Sell nav menu retrieved successfully', data })
}
