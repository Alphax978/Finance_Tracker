import app from '../src/app'

// Vercel's Node runtime treats a default-exported request handler under
// api/ as a serverless function — an Express app already *is* one
// ((req, res) => void), so this file is just a thin re-export. vercel.json
// rewrites every path to this single function; Express does the real
// routing internally via req.url, exactly like it does locally.
export default app
