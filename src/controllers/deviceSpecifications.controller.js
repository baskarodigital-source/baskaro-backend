import { BrandDevice } from '../models/BrandDevice.js'
import { DeviceSpecificationMaster } from '../models/DeviceSpecificationMaster.js'
import { DeviceSpecificationOption } from '../models/DeviceSpecificationOption.js'
import { successResponse } from '../utils/helpers.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function keyify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function listByDevice(req, res) {
  const { deviceId } = req.params
  const device = await BrandDevice.findById(deviceId).lean()
  if (!device) throw new AppError('Device not found', 404, errorCodes.NOT_FOUND)

  const masters = await DeviceSpecificationMaster.find({ deviceId, isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean()
  const ids = masters.map((m) => m._id)
  const opts = ids.length
    ? await DeviceSpecificationOption.find({ specId: { $in: ids }, isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean()
    : []

  const bySpec = opts.reduce((acc, o) => {
    const k = String(o.specId)
    if (!acc[k]) acc[k] = []
    acc[k].push({ id: o._id, value: o.value })
    return acc
  }, {})

  const data = masters.map((m) => ({
    id: m._id,
    key: m.key,
    name: m.name,
    type: m.type,
    required: !!m.isRequired,
    options: m.type === 'dropdown' ? (bySpec[String(m._id)] || []) : [],
  }))

  return successResponse(res, data, 'Device specifications retrieved successfully')
}

export async function createSpec(req, res) {
  const { deviceId, name, type, isRequired = false } = req.body || {}
  if (!deviceId) throw new AppError('deviceId is required', 400, errorCodes.VALIDATION_ERROR)
  if (!name || !String(name).trim()) throw new AppError('name is required', 400, errorCodes.VALIDATION_ERROR)
  if (!type) throw new AppError('type is required', 400, errorCodes.VALIDATION_ERROR)

  const device = await BrandDevice.findById(deviceId).lean()
  if (!device) throw new AppError('Device not found', 404, errorCodes.NOT_FOUND)

  const nameTrim = String(name).trim()
  const key = keyify(nameTrim)
  if (!key) throw new AppError('Invalid specification name', 400, errorCodes.VALIDATION_ERROR)

  const last = await DeviceSpecificationMaster.findOne({ deviceId }).sort({ sortOrder: -1 }).lean()
  const sortOrder = (last?.sortOrder ?? -1) + 1

  const doc = await DeviceSpecificationMaster.create({
    deviceId,
    name: nameTrim,
    nameLower: nameTrim.toLowerCase(),
    key,
    type,
    isRequired: !!isRequired,
    sortOrder,
    isActive: true,
  })

  return successResponse(res, { id: doc._id, deviceId: doc.deviceId, key: doc.key, name: doc.name, type: doc.type, required: !!doc.isRequired }, 'Specification created successfully', 201)
}

export async function createOption(req, res) {
  const { specId, value } = req.body || {}
  if (!specId) throw new AppError('specId is required', 400, errorCodes.VALIDATION_ERROR)
  if (!value || !String(value).trim()) throw new AppError('value is required', 400, errorCodes.VALIDATION_ERROR)

  const spec = await DeviceSpecificationMaster.findById(specId).lean()
  if (!spec) throw new AppError('Specification not found', 404, errorCodes.NOT_FOUND)
  if (spec.type !== 'dropdown') throw new AppError('Options are allowed only for dropdown specifications', 400, errorCodes.BAD_REQUEST)

  const v = String(value).trim()
  const last = await DeviceSpecificationOption.findOne({ specId }).sort({ sortOrder: -1 }).lean()
  const sortOrder = (last?.sortOrder ?? -1) + 1

  const opt = await DeviceSpecificationOption.create({
    specId,
    value: v,
    valueLower: v.toLowerCase(),
    sortOrder,
    isActive: true,
  })

  return successResponse(res, { id: opt._id, specId: opt.specId, value: opt.value }, 'Option created successfully', 201)
}

export async function updateSpec(req, res) {
  const { specId } = req.params
  const { name, type, isRequired } = req.body || {}

  const spec = await DeviceSpecificationMaster.findById(specId)
  if (!spec) throw new AppError('Specification not found', 404, errorCodes.NOT_FOUND)

  const update = {}
  if (name !== undefined) {
    const nameTrim = String(name || '').trim()
    if (!nameTrim) throw new AppError('name is required', 400, errorCodes.VALIDATION_ERROR)
    update.name = nameTrim
    update.nameLower = nameTrim.toLowerCase()
    update.key = keyify(nameTrim)
    if (!update.key) throw new AppError('Invalid specification name', 400, errorCodes.VALIDATION_ERROR)
  }
  if (type !== undefined) update.type = type
  if (isRequired !== undefined) update.isRequired = !!isRequired

  const doc = await DeviceSpecificationMaster.findByIdAndUpdate(specId, update, { new: true, runValidators: true })
  return successResponse(res, { id: doc._id, key: doc.key, name: doc.name, type: doc.type, required: !!doc.isRequired }, 'Specification updated successfully')
}

export async function deleteSpec(req, res) {
  const { specId } = req.params
  const spec = await DeviceSpecificationMaster.findById(specId)
  if (!spec) throw new AppError('Specification not found', 404, errorCodes.NOT_FOUND)
  await DeviceSpecificationOption.deleteMany({ specId: spec._id })
  await spec.deleteOne()
  return successResponse(res, { success: true }, 'Specification deleted successfully')
}

export async function deleteOption(req, res) {
  const { optionId } = req.params
  const opt = await DeviceSpecificationOption.findById(optionId)
  if (!opt) throw new AppError('Option not found', 404, errorCodes.NOT_FOUND)
  await opt.deleteOne()
  return successResponse(res, { success: true }, 'Option deleted successfully')
}

