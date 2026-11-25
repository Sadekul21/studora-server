import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import { connectDB } from './db.js'
import authRoutes from './routes/auth.js'
import studioRoutes from './routes/studios.js'
import bookingRoutes from './routes/bookings.js'

const app = express()
const port = process.env.PORT || 8000

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('Studora server is running')
})

app.use(authRoutes)
app.use(studioRoutes)
app.use(bookingRoutes)

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Studora server listening on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB', error)
  })
