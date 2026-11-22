import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getCollection } from '../db.js'
import verifyToken from '../middleware/verifyToken.js'

const router = Router()

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
}

const getSessionToken = (req) => {
  const raw =
    req.cookies['__Secure-better-auth.session_token'] ||
    req.cookies['better-auth.session_token']

  if (!raw) return null
  return decodeURIComponent(raw).split('.')[0]
}

router.post('/jwt', async (req, res) => {
  const sessionToken = getSessionToken(req)
  if (!sessionToken) {
    return res.status(401).send({ message: 'Not logged in' })
  }

  const session = await getCollection('session').findOne({
    token: sessionToken,
    expiresAt: { $gt: new Date() }
  })
  if (!session) {
    return res.status(401).send({ message: 'Session expired' })
  }

  const userId =
    typeof session.userId === 'string' ? new ObjectId(session.userId) : session.userId
  const user = await getCollection('user').findOne({ _id: userId })
  if (!user) {
    return res.status(401).send({ message: 'User not found' })
  }

  const payload = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image || ''
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

  res
    .cookie('token', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .send({ success: true, user: payload })
})

router.get('/me', verifyToken, (req, res) => {
  res.send(req.user)
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions).send({ success: true })
})

export default router
