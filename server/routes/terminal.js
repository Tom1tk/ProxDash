import { WebSocketServer } from 'ws'
import { Client as SSHClient } from 'ssh2'
import 'dotenv/config'

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/terminal' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost')
    const target = url.searchParams.get('target') || 'prox'

    const envKey = `SSH_HOST_${target}`
    const connStr = process.env[envKey]

    if (!connStr) {
      ws.send('\r\n\x1b[31mNo SSH config for target: ' + target + '\x1b[0m\r\n')
      ws.close()
      return
    }

    const match = connStr.match(/^(.+?):(.+?)@(.+?):(\d+)$/)
    if (!match) { ws.close(); return }
    const [, username, password, host, port] = match

    const ssh = new SSHClient()
    ssh.on('ready', () => {
      ssh.shell({ term: 'xterm-color', cols: 80, rows: 24 }, (err, stream) => {
        if (err) { ws.send('\r\nSSH shell error\r\n'); ws.close(); return }

        stream.on('data', d => ws.readyState === 1 && ws.send(d.toString('utf8')))
        stream.stderr.on('data', d => ws.readyState === 1 && ws.send(d.toString('utf8')))
        stream.on('close', () => ws.close())

        ws.on('message', data => {
          try {
            const msg = JSON.parse(data)
            if (msg.type === 'resize') stream.setWindow(msg.rows, msg.cols)
          } catch {
            stream.write(data)
          }
        })
        ws.on('close', () => ssh.end())
      })
    })
    ssh.on('error', err => {
      ws.send(`\r\n\x1b[31mSSH error: ${err.message}\x1b[0m\r\n`)
      ws.close()
    })
    ssh.connect({ host, port: parseInt(port), username, password })
  })
}
