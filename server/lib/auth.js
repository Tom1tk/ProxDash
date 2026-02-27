import crypto from 'crypto'

const sessions = new Map()
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

export function pinLogin(req, res) {
  const { pin } = req.body
  if (!process.env.APP_PIN) {
    return res.json({ token: 'no-auth' })
  }
  if (pin !== process.env.APP_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' })
  }
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, Date.now() + SESSION_TTL)
  res.json({ token })
}

export function pinAuth(req, res, next) {
  if (!process.env.APP_PIN) return next()
  const token = req.headers['x-auth-token'] || req.query.token
  const expiry = sessions.get(token)
  if (!expiry || Date.now() > expiry) {
    return res.status(401).json({ error: 'Unauthorised' })
  }
  next()
}
