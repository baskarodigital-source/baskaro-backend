import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import cors from "cors";

import { connectDb } from './src/config/db.js'
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

// ✅ Read origins from ENV (comma separated)
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

// ✅ Dynamic CORS using ENV only
app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server / postman requests (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true
}));

// ✅ Handle preflight
app.options("*", cors());

const PORT = process.env.PORT || 4000

await connectDb()
await RibbonCategory.syncIndexes()

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})