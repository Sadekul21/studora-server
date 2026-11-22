import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './db.js'

const app = express()
const port = process.env.PORT || 8000

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Studora server is running')
})

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Studora server listening on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB', error)
  })
