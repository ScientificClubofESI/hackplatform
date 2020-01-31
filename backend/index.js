const express = require('express')
const bodyParser = require('body-parser')
const { errors } = require('celebrate')
const path = require('path')
const helmet = require('helmet')
const sslRedirect = require('heroku-ssl-redirect')
const throng = require('throng')

/** Create Express application */
const app = express()

/* Prepare config */
require('./misc/config')

/** Set up logging */
const logger = require('./misc/logger')

// Enable route logging by uncommenting this line
/** Use helmet for some basic security measures */
app.use(helmet())

/* Force SSL Redirect in production */
app.use(sslRedirect(['production'], 301))

/* Enable body-parser */
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

/* JWT-middleware from all requests */
const { verifyToken, parseToken } = require('./misc/jwt')

app.use(verifyToken)
app.use(parseToken)

/* Register API routes */
require('./modules/routes')(app)

/* Register GraphQL server */
require('./modules/graphql')(app)

/* Serve frontend at all other routes */
if (process.env.NODE_ENV === 'production') {
    const root = path.join(__dirname, 'build')
    app.use(express.static(root))
    app.get('*', (req, res) => {
        res.sendFile('index.html', { root })
    })
}

/* Handle Joi validation errors */
app.use(errors())

/* Global error handler */
app.use(require('./common/errors/errorHandler'))

/* Database connection */
const database = require('./misc/db')
/* Migrations to run before exposing the server */
const migrations = require('./migrations/index')

async function start() {
    /** Make sure these finish successfully before trying to start the server */
    try {
        await database.connect()
        await migrations.run()
        /** Use throng to take advantage of all available CPU resources */
        throng({
            workers: process.env.WEB_CONCURRENCY || 1,
            grace: 1000,
            lifetime: Infinity,
            /** Start the master process (1) */
            master: async () => {
                logger.info(`Master ${process.pid} started`)
                await new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        console.log('Timeout done')
                        resolve()
                    }, 2000)
                })
                /** Run cron jobs here for now, migrate to cron-cluster later */
                // cron.utils.startAll();
            },
            /** Start the slave processes (1-n) */
            start: () => {
                const PORT = process.env.PORT || 2222
                app.listen(PORT, () => {
                    logger.info(
                        `Worker ${process.pid} started, listening on port ${PORT}`
                    )
                })
            },
        })
    } catch (err) {
        logger.error({
            message: 'Server startup failed',
            error: {
                message: err.message,
                stack: err.stack,
            },
        })
        process.exit(1)
    }
}

start()
