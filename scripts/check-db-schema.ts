import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { Pool } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('ERROR: SUPABASE_DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

async function checkSchema() {
  try {
    console.log('Checking database connection...')
    await pool.query('SELECT NOW()')
    console.log('✓ Database connection successful\n')

    const tables = [
      { name: 'user', quoted: '"user"' },
      { name: 'session', quoted: 'session' },
      { name: 'account', quoted: 'account' },
      { name: 'verification', quoted: 'verification' }
    ]

    console.log('Checking Better Auth tables...\n')
    let allExist = true

    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table.name]
      )
      const exists = result.rows[0]?.exists
      
      if (exists) {
        // Check if table has data
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table.quoted}`)
        const count = countResult.rows[0]?.count || 0
        console.log(`✓ Table "${table.name}" exists (${count} rows)`)
      } else {
        console.error(`✗ Table "${table.name}" does NOT exist`)
        allExist = false
      }
    }

    if (!allExist) {
      console.error('\n❌ Missing tables detected!')
      console.error('Please run the migration: supabase/migrations/013_better_auth_schema.sql')
      console.error('\nYou can run it in:')
      console.error('1. Supabase Dashboard → SQL Editor')
      console.error('2. Or using Supabase CLI: supabase db push')
      process.exit(1)
    } else {
      console.log('\n✓ All Better Auth tables exist!')
    }

    await pool.end()
  } catch (error: any) {
    console.error('Error:', error.message)
    console.error(error.stack)
    await pool.end()
    process.exit(1)
  }
}

checkSchema()

