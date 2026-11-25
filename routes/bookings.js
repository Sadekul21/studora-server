import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getCollection } from '../db.js'
import verifyToken from '../middleware/verifyToken.js'

const router = Router()

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const today = () => new Date().toISOString().slice(0, 10)

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const findConfirmedOverlap = (studioId, date, startTime, endTime, excludeId) => {
  const query = {
    studioId,
    date,
    status: 'Confirmed',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }
  if (excludeId) query._id = { $ne: excludeId }
  return getCollection('bookings').findOne(query)
}

const markPastAsCompleted = () =>
  getCollection('bookings').updateMany(
    { status: 'Confirmed', date: { $lt: today() } },
    { $set: { status: 'Completed' } }
  )

router.get('/studios/:id/booked', async (req, res) => {
  const { id } = req.params
  const { date } = req.query
  if (!ObjectId.isValid(id) || !datePattern.test(date || '')) {
    return res.status(400).send({ message: 'Studio and date are required' })
  }

  const slots = await getCollection('bookings')
    .find(
      { studioId: new ObjectId(id), date, status: 'Confirmed' },
      { projection: { _id: 0, startTime: 1, endTime: 1 } }
    )
    .sort({ startTime: 1 })
    .toArray()

  res.send(slots)
})

router.post('/bookings', verifyToken, async (req, res) => {
  const { studioId, date, startTime, endTime, guests, note } = req.body

  if (!ObjectId.isValid(studioId)) {
    return res.status(400).send({ message: 'Invalid studio' })
  }
  if (!datePattern.test(date || '') || date < today()) {
    return res.status(400).send({ message: 'Pick a date from today onwards' })
  }
  if (!timePattern.test(startTime || '') || !timePattern.test(endTime || '')) {
    return res.status(400).send({ message: 'Pick a start and end time' })
  }

  const minutes = toMinutes(endTime) - toMinutes(startTime)
  if (minutes < 60) {
    return res.status(400).send({ message: 'Bookings must be at least 1 hour long' })
  }

  const studio = await getCollection('studios').findOne({ _id: new ObjectId(studioId) })
  if (!studio) {
    return res.status(404).send({ message: 'Studio not found' })
  }
  if (studio.ownerEmail === req.user.email) {
    return res.status(403).send({ message: 'You can’t book your own studio' })
  }

  const crew = Number(guests) || 1
  if (crew < 1 || crew > studio.maxCapacity) {
    return res.status(400).send({ message: `This studio fits up to ${studio.maxCapacity} people` })
  }

  const clash = await findConfirmedOverlap(studio._id, date, startTime, endTime)
  if (clash) {
    return res.status(409).send({
      message: `Already booked from ${clash.startTime} to ${clash.endTime} on that day. Please pick other hours.`
    })
  }

  const hours = minutes / 60
  const booking = {
    studioId: studio._id,
    studioTitle: studio.title,
    studioImage: studio.image,
    studioLocation: studio.location,
    studioCategory: studio.category,
    hostName: studio.ownerName,
    hostEmail: studio.ownerEmail,
    userName: req.user.name,
    userEmail: req.user.email,
    userImage: req.user.image,
    date,
    startTime,
    endTime,
    hours,
    guests: crew,
    note: String(note || '').trim().slice(0, 500),
    hourlyRate: studio.hourlyRate,
    securityDeposit: studio.securityDeposit,
    totalPrice: studio.hourlyRate * hours,
    status: 'Pending',
    createdAt: new Date()
  }

  const result = await getCollection('bookings').insertOne(booking)
  res.status(201).send({ success: true, insertedId: result.insertedId })
})

router.get('/my-bookings', verifyToken, async (req, res) => {
  await markPastAsCompleted()

  const bookings = await getCollection('bookings')
    .find({ userEmail: req.user.email })
    .sort({ date: -1, startTime: -1 })
    .toArray()

  res.send(bookings)
})

router.get('/host-bookings', verifyToken, async (req, res) => {
  await markPastAsCompleted()

  const bookings = await getCollection('bookings')
    .find({ hostEmail: req.user.email })
    .sort({ date: 1, startTime: 1 })
    .toArray()

  res.send(bookings)
})

router.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid booking id' })
  }

  const booking = await getCollection('bookings').findOne({ _id: new ObjectId(id) })
  if (!booking) {
    return res.status(404).send({ message: 'Booking not found' })
  }
  if (booking.userEmail !== req.user.email) {
    return res.status(403).send({ message: 'You can only cancel your own bookings' })
  }
  if (booking.status !== 'Pending') {
    return res.status(400).send({ message: 'Only pending bookings can be cancelled' })
  }

  await getCollection('bookings').updateOne(
    { _id: booking._id },
    { $set: { status: 'Cancelled', updatedAt: new Date() } }
  )
  res.send({ success: true })
})

router.patch('/bookings/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid booking id' })
  }
  if (!['Confirmed', 'Cancelled'].includes(status)) {
    return res.status(400).send({ message: 'Status must be Confirmed or Cancelled' })
  }

  const booking = await getCollection('bookings').findOne({ _id: new ObjectId(id) })
  if (!booking) {
    return res.status(404).send({ message: 'Booking not found' })
  }
  if (booking.hostEmail !== req.user.email) {
    return res.status(403).send({ message: 'Only the host can confirm or decline this booking' })
  }
  if (booking.status !== 'Pending') {
    return res.status(400).send({ message: 'This booking has already been handled' })
  }

  if (status === 'Confirmed') {
    const clash = await findConfirmedOverlap(
      booking.studioId,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking._id
    )
    if (clash) {
      return res.status(409).send({
        message: `These hours overlap a confirmed booking (${clash.startTime}–${clash.endTime}).`
      })
    }
  }

  await getCollection('bookings').updateOne(
    { _id: booking._id },
    { $set: { status, updatedAt: new Date() } }
  )
  res.send({ success: true })
})

export default router
