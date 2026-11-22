import { MongoClient, ServerApiVersion } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

let db

export async function connectDB() {
  if (db) return db
  await client.connect()
  db = client.db(process.env.DB_NAME || 'studora')
  await db.command({ ping: 1 })
  console.log('Connected to MongoDB')
  return db
}

export function getCollection(name) {
  return db.collection(name)
}
