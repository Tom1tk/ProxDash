module.exports = {
  apps: [{
    name: 'proxdash',
    script: '/opt/proxdash/server/index.js',
    cwd: '/opt/proxdash/server',
    node_args: '--env-file=/opt/proxdash/server/.env',
    interpreter: 'node',
  }]
}
