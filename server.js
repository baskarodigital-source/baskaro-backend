import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

import { connectDb } from './src/config/db.js'
import { logCloudinaryStatus } from './src/config/cloudinary.js'
import { app } from './src/app.js'
import { RibbonCategory } from './src/models/RibbonCategory.js'

// Load env
const candidatePaths = ['.env', 'src/.env']
for (const p of candidatePaths) {
  const absPath = path.resolve(process.cwd(), p)
  if (fs.existsSync(absPath)) {
    const result = dotenv.config({ path: absPath })
    if (result?.error) throw result.error
    break
  }
}

const PORT = process.env.PORT || 4000

// Temporary: verify env is loaded before Mongo connect
dotenv.config()
console.log(process.env.MONGODB_URI)

await connectDb()
await RibbonCategory.syncIndexes()

await logCloudinaryStatus({ ping: true })

const server = app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})
// Large video uploads: client send + Cloudinary relay can exceed Node’s default 5 min limit
const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000
server.requestTimeout = UPLOAD_TIMEOUT_MS
server.headersTimeout = UPLOAD_TIMEOUT_MS + 10_000
server.timeout = UPLOAD_TIMEOUT_MS
server.keepAliveTimeout = 65_000