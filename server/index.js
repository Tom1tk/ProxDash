import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { setupWebSocket } from './routes/terminal.js'
import nodesRouter from './routes/nodes.js'
import containersRouter from './routes/containers.js'
import vmsRouter from './routes/vms.js'
import statsRouter from './routes/stats.js'
import { pinAuth, pinLogin } from './lib/auth.js'
import 'dotenv/config'

const app = express()
const server = createServer(app)

app.use(helmet())
app.use(express.json())
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }))

app.post('/api/auth/login', pinLogin)
app.get('/api/auth/check', pinAuth, (req, res) => res.json({ ok: true }))

app.use('/api', pinAuth)
app.use('/api/nodes', nodesRouter)
app.use('/api/containers', containersRouter)
app.use('/api/vms', vmsRouter)
app.use('/api/stats', statsRouter)

app.use(express.static('../client/dist'))
app.get('*', (req, res) => res.sendFile('../client/dist/index.html'))

setupWebSocket(server)

server.listen(process.env.PORT || 3001, () => {
  console.log(`ProxDash server running on port ${process.env.PORT || 3001}`)
})
