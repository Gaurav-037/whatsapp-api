const express = require('express')
const messageRouter = require('./routers/messageRouter')
const whatsappClient = require('./services/WhatsappClient')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(messageRouter)

// Graceful initialization
function startServer() {
    try {
        // Use the initialize method with proper error handling
        whatsappClient.initialize()
            .then(() => {
                // Start server only after successful initialization
                const server = app.listen(PORT, () => {
                    console.log(`Server is ready on port ${PORT}!`)
                });

                // Handle server errors
                server.on('error', (error) => {
                    console.error('Server error:', error)
                    process.exit(1)
                });

                // Graceful shutdown
                process.on('SIGTERM', () => {
                    console.log('SIGTERM received. Shutting down gracefully')
                    server.close(() => {
                        console.log('Process terminated')
                        process.exit(0)
                    })
                });
            })
            .catch((error) => {
                console.error('Initialization failed:', error);
                // Retry after a delay
                setTimeout(startServer, 5000);
            });
    } catch (error) {
        console.error('Startup error:', error);
        // Retry after a delay
        setTimeout(startServer, 5000);
    }
}

// Start the server
startServer()
// const express = require('express')
// const messageRouter = require('./routers/messageRouter')
// const whatsappClient = require('./services/WhatsappClient')

// const app = express()
// const PORT = process.env.PORT || 3000

// // Middleware
// app.use(express.json())
// app.use(messageRouter)

// // Graceful initialization
// function startServer() {
//     try {
//         // Initialize WhatsApp client
//         whatsappClient.initialize()

//         // Start server
//         const server = app.listen(PORT, () => {
//             console.log(`Server is ready on port ${PORT}!`)
//         })

//         // Handle server errors
//         server.on('error', (error) => {
//             console.error('Server error:', error)
//             process.exit(1)
//         })

//         // Graceful shutdown
//         process.on('SIGTERM', () => {
//             console.log('SIGTERM received. Shutting down gracefully')
//             server.close(() => {
//                 console.log('Process terminated')
//                 process.exit(0)
//             })
//         })
//     } catch (error) {
//         console.error('Initialization failed:', error)
//         // Retry after a delay
//         setTimeout(startServer, 5000)
//     }
// }

// // Start the server
// startServer()