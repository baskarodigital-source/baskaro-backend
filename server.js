import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { connectDb } from './src/config/db.js'
import { app } from './src/app.js'
import { RibbonCategory } from './src/models/RibbonCategory.js'

// Load env from backend root, but also support `src/.env` (some setups store it there).
// (We first try the backend root `.env` because it’s the most reliable location.)
const candidatePaths = ['.env', 'src/.env']
for (const p of candidatePaths) {
  const absPath = path.resolve(process.cwd(), p)
  if (fs.existsSync(absPath)) {
    const result = dotenv.config({ path: absPath })
    if (result?.error) {
      // Surface misconfigured .env immediately (instead of failing later in Mongo connect)
      throw result.error
    }
    break
  }
}

const PORT = process.env.PORT || 4000

await connectDb()
// Drop legacy DB indexes not present on the current schema (e.g. old unique `slug` caused E11000 on seed).
await RibbonCategory.syncIndexes()

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})

