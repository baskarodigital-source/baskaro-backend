import mongoose from 'mongoose'

export async function connectDb() {
  const {
    MONGODB_URI,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB,
    MONGO_USER,
    MONGO_PASS,
    MONGO_AUTH_SOURCE,
    MONGO_TLS,
  } = process.env

  // Prefer a full URI if provided.
  let uri = MONGODB_URI

  // Otherwise build from individual credentials.
  if (!uri) {
    const host = MONGO_HOST || '127.0.0.1'
    const port = MONGO_PORT || '27017'
    const db = MONGO_DB

    // If no db is provided, fail fast with a clear message.
    if (!db) {
      throw new Error(
        'MongoDB config missing. Set `MONGODB_URI` OR set `MONGO_DB` (with optional MONGO_HOST/MONGO_PORT/MONGO_USER/MONGO_PASS).',
      )
    }

    const user = MONGO_USER ? encodeURIComponent(MONGO_USER) : ''
    const pass = MONGO_PASS ? encodeURIComponent(MONGO_PASS) : ''
    const authPart = user && pass ? `${user}:${pass}@` : ''

    const authSource = MONGO_AUTH_SOURCE ? `&authSource=${encodeURIComponent(MONGO_AUTH_SOURCE)}` : '&authSource=admin'
    const tlsPart = MONGO_TLS ? `&tls=${String(MONGO_TLS)}` : ''

    uri = `mongodb://${authPart}${host}:${port}/${encodeURIComponent(db)}?retryWrites=true${authSource}${tlsPart}`
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
