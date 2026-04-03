// ---------------------------------------------------------------------------
// MongoDB client singleton — connects to the pitchdecker database
// on aimee-prod.stjbrda.mongodb.net
// ---------------------------------------------------------------------------

import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

const DATABASE_NAME = 'pitchdecker'

export async function getDb(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_CONNECTION_STRING
  if (!uri) {
    throw new Error('MONGODB_CONNECTION_STRING is not set')
  }

  client = new MongoClient(uri)
  await client.connect()
  db = client.db(DATABASE_NAME)

  return db
}

export async function getCollection<T extends Document>(name: string) {
  const database = await getDb()
  return database.collection<T>(name)
}
