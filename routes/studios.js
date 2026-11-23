import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getCollection } from '../db.js'
import verifyToken from '../middleware/verifyToken.js'

const router = Router()

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

const readStudio = (body) => {
  const studio = {
    title: String(body.title || '').trim(),
    category: String(body.category || '').trim(),
    hourlyRate: Number(body.hourlyRate),
    securityDeposit: Number(body.securityDeposit),
    maxCapacity: Number(body.maxCapacity),
    location: String(body.location || '').trim(),
    image: String(body.image || '').trim(),
    gallery: toList(body.gallery).filter(isUrl),
    amenities: toList(body.amenities),
    overview: String(body.overview || '').trim()
  }

  if (studio.title.length < 3) return { error: 'Title must be at least 3 characters' }
  if (!studio.category) return { error: 'Category is required' }
  if (!(studio.hourlyRate > 0)) return { error: 'Hourly rate must be more than 0' }
  if (!(studio.securityDeposit >= 0)) return { error: 'Security deposit cannot be negative' }
  if (!Number.isInteger(studio.maxCapacity) || studio.maxCapacity < 1) {
    return { error: 'Max capacity must be at least 1 person' }
  }
  if (!studio.location) return { error: 'Location is required' }
  if (!isUrl(studio.image)) return { error: 'A valid image URL is required' }
  if (studio.overview.length < 20) return { error: 'Overview must be at least 20 characters' }

  return { studio }
}

const findOwnStudio = async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    res.status(400).send({ message: 'Invalid studio id' })
    return null
  }

  const studio = await getCollection('studios').findOne({ _id: new ObjectId(id) })
  if (!studio) {
    res.status(404).send({ message: 'Studio not found' })
    return null
  }

  if (studio.ownerEmail !== req.user.email) {
    res.status(403).send({ message: 'You can only change your own listings' })
    return null
  }

  return studio
}

const sortOptions = {
  newest: { createdAt: -1 },
  'price-asc': { hourlyRate: 1 },
  'price-desc': { hourlyRate: -1 },
  rating: { rating: -1 }
}

router.get('/studios', async (req, res) => {
  const { search, category, location, minPrice, maxPrice, capacity, sort } = req.query
  const query = {}

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    query.$or = [{ title: pattern }, { location: pattern }, { category: pattern }]
  }

  if (category) {
    query.category = category
  }

  if (location) {
    query.location = { $regex: escapeRegex(location), $options: 'i' }
  }

  if (minPrice || maxPrice) {
    query.hourlyRate = {}
    if (minPrice) query.hourlyRate.$gte = Number(minPrice)
    if (maxPrice) query.hourlyRate.$lte = Number(maxPrice)
  }

  if (capacity) {
    query.maxCapacity = { $gte: Number(capacity) }
  }

  const studios = await getCollection('studios')
    .find(query)
    .sort(sortOptions[sort] || sortOptions.newest)
    .toArray()

  res.send(studios)
})

router.get('/studios/featured', async (req, res) => {
  const studios = await getCollection('studios')
    .find()
    .sort({ rating: -1, reviewCount: -1 })
    .limit(6)
    .toArray()

  res.send(studios)
})

router.get('/studios/:id', async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid studio id' })
  }

  const studio = await getCollection('studios').findOne({ _id: new ObjectId(id) })
  if (!studio) {
    return res.status(404).send({ message: 'Studio not found' })
  }

  res.send(studio)
})

router.get('/my-studios', verifyToken, async (req, res) => {
  const studios = await getCollection('studios')
    .find({ ownerEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray()

  res.send(studios)
})

router.post('/studios', verifyToken, async (req, res) => {
  const { studio, error } = readStudio(req.body)
  if (error) {
    return res.status(400).send({ message: error })
  }

  const newStudio = {
    ...studio,
    ownerName: req.user.name,
    ownerEmail: req.user.email,
    ownerImage: req.user.image,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date()
  }

  const result = await getCollection('studios').insertOne(newStudio)
  res.status(201).send({ success: true, insertedId: result.insertedId })
})

router.put('/studios/:id', verifyToken, async (req, res) => {
  const existing = await findOwnStudio(req, res)
  if (!existing) return

  const { studio, error } = readStudio(req.body)
  if (error) {
    return res.status(400).send({ message: error })
  }

  await getCollection('studios').updateOne(
    { _id: existing._id },
    { $set: { ...studio, updatedAt: new Date() } }
  )
  res.send({ success: true })
})

router.delete('/studios/:id', verifyToken, async (req, res) => {
  const existing = await findOwnStudio(req, res)
  if (!existing) return

  await getCollection('studios').deleteOne({ _id: existing._id })
  res.send({ success: true })
})

export default router
