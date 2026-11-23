import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getCollection } from '../db.js'

const router = Router()

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

export default router
