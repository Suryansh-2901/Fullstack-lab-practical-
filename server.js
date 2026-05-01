//Node.js HTTP Server
//declaration of constraints 
const http = require('http')
const fs = require('fs')
const os = require('os')
const url = require('url')
const path = require('path')

const PORT = 3000
const LOG_FILE = path.join(__dirname, 'visitors.log')
const BACKUP_FILE = path.join(__dirname, 'backup.log')

function sendJSON(res, obj, status = 200) {
    const body = JSON.stringify(obj)
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(body)
}

function sendText(res, txt, status = 200) {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(txt)
}

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true)
    const pathname = parsed.pathname || '/'

    if (req.method === 'GET' && pathname === '/updateUser') {
        const entry = new Date().toISOString() + '\n'
        fs.appendFile(LOG_FILE, entry, (err) => {
            if (err) return sendText(res, 'Failed to append log', 500)
            sendText(res, 'Visitor logged')
        })
        return
    }

    if (req.method === 'GET' && pathname === '/savelog') {
        fs.readFile(LOG_FILE, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') return sendText(res, '')
                return sendText(res, 'Failed to read log', 500)
            }
            sendText(res, data)
        })
        return
    }

    if (req.method === 'POST' && pathname === '/backup') {
        // copy visitors.log to backup.log; if source doesn't exist create empty backup
        fs.copyFile(LOG_FILE, BACKUP_FILE, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // create empty backup
                    return fs.writeFile(BACKUP_FILE, '', (err2) => {
                        if (err2) return sendText(res, 'Failed to create backup', 500)
                        sendText(res, 'Backup created')
                    })
                }
                return sendText(res, 'Failed to create backup', 500)
            }
            sendText(res, 'Backup created')
        })
        return
    }

    if (req.method === 'GET' && pathname === '/clearlog') {
        // truncate or remove file
        fs.truncate(LOG_FILE, 0, (err) => {
            if (err && err.code !== 'ENOENT') return sendText(res, 'Failed to clear log', 500)
            sendText(res, 'Log cleared')
        })
        return
    }

    if (req.method === 'GET' && pathname === '/serverinfo') {
        const info = {
            hostname: os.hostname(),
            platform: os.platform(),
            type: os.type(),
            arch: os.arch(),
            uptime: os.uptime(),
            cpus: os.cpus().length,
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            networkInterfaces: os.networkInterfaces()
        }
        return sendJSON(res, info)
    }

    sendText(res, 'Not Found', 404)
})

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})