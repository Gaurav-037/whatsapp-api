const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsappClient {
    constructor() {
        this.sessionPath = path.resolve('./whatsapp-session');
        this.client = null;
        this.isInitializing = false;
        
        // Add a method to manually trigger initialization if needed
        this.initialize = this.initializeClient.bind(this);
    }

    initializeClient() {
        // Check if already initializing to prevent multiple attempts
        if (this.isInitializing) {
            console.log('Initialization already in progress');
            return Promise.resolve();
        }

        this.isInitializing = true;

        // Ensure session directory exists
        this.ensureDirectoryExists(this.sessionPath);

        return new Promise((resolve, reject) => {
            try {
                this.client = new Client({
                    authStrategy: new LocalAuth({
                        dataPath: this.sessionPath
                    }),
                    puppeteer: {
                        headless: 'new',
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-accelerated-2d-canvas',
                            '--no-first-run',
                            '--no-zygote',
                            '--single-process',
                            '--disable-gpu'
                        ],
                        defaultViewport: null,
                        timeout: 60000
                    },
                    webVersionCache: {
                        type: 'remote',
                        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
                    }
                });

                // Setup client events
                this.setupClientEvents();

                // Initialize client with timeout
                const initTimeout = setTimeout(() => {
                    this.isInitializing = false;
                    reject(new Error('Initialization timeout'));
                }, 90000);

                this.client.initialize()
                    .then(() => {
                        clearTimeout(initTimeout);
                        this.isInitializing = false;
                        console.log('Client initialized successfully');
                        resolve();
                    })
                    .catch((error) => {
                        clearTimeout(initTimeout);
                        this.isInitializing = false;
                        console.error('Initialization error:', error);
                        reject(error);
                    });
            } catch (error) {
                this.isInitializing = false;
                console.error('Client creation error:', error);
                reject(error);
            }
        });
    }

    ensureDirectoryExists(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } catch (error) {
            console.error('Directory creation error:', error);
        }
    }

    safeInitialize() {
        const initTimeout = setTimeout(() => {
            console.log('Initialization taking too long, forcing restart');
            this.forceRestart();
        }, 90000); // 90 seconds timeout

        this.client.initialize()
            .then(() => {
                clearTimeout(initTimeout);
                this.isInitializing = false;
                console.log('Client initialized successfully');
            })
            .catch((error) => {
                clearTimeout(initTimeout);
                this.isInitializing = false;
                console.error('Initialization error:', error);
                this.retryInitialization();
            });
    }

    setupClientEvents() {
        if (!this.client) return;

        this.client.on('qr', (qr) => {
            console.log('QR Code Generated');
            console.log(qr) 
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('Client is ready!');
        });

        this.client.on('message', async (msg) => {
            try {
                if (msg.from !== "status@broadcast") {
                    const contact = await msg.getContact();
                    console.log(contact, msg.body);
                }
            } catch (error) {
                console.error('Message handling error:', error);
            }
        });

        this.client.on('disconnected', (reason) => {
            console.log('Client was logged out', reason);
            this.forceRestart();
        });

        this.client.on('auth_failure', (msg) => {
            console.error('Authentication failed:', msg);
            this.forceRestart();
        });
    }

    forceRestart() {
        try {
            // Destroy existing client
            if (this.client) {
                this.client.destroy().catch(() => {});
            }

            // Cleanup session directory
            this.safeCleanupDirectory(this.sessionPath);

            // Reset initialization flag
            this.isInitializing = false;

            // Reinitialize after a short delay
            setTimeout(() => this.initializeClient(), 5000);
        } catch (error) {
            console.error('Force restart error:', error);
        }
    }

    safeCleanupDirectory(dirPath) {
        try {
            // Use fs.rm with recursive and force options
            fs.rm(dirPath, { 
                recursive: true, 
                force: true 
            }, (err) => {
                if (err) {
                    console.error('Directory cleanup error:', err);
                }
                // Recreate the directory
                this.ensureDirectoryExists(dirPath);
            });
        } catch (error) {
            console.error('Safe cleanup error:', error);
        }
    }

    retryInitialization() {
        setTimeout(() => {
            if (!this.isInitializing) {
                this.initializeClient();
            }
        }, 10000); // 10-second delay
    }

    sendMessage(phoneNumber, message) {
        return new Promise((resolve, reject) => {
            if (!this.client || this.client.state !== 'CONNECTED') {
                reject(new Error('WhatsApp client not ready'));
                return;
            }

            try {
                this.client.sendMessage(phoneNumber + '@c.us', message)
                    .then(resolve)
                    .catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    getQRCodePath() {
        return path.join(this.sessionPath, 'qr-code.png');
    }

    isReady() {
        return this.client && this.client.state === 'CONNECTED';
    }
}


module.exports = new WhatsappClient();

// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');

// class WhatsappClient {
//     constructor() {
//         this.client = new Client({
//             authStrategy: new LocalAuth({
//                 dataPath: './whatsapp-session'
//             }),
//             puppeteer: {
//                 headless: true,
//                 args: [
//                     '--no-sandbox',
//                     '--disable-setuid-sandbox',
//                     '--disable-dev-shm-usage',
//                     '--disable-accelerated-2d-canvas',
//                     '--no-first-run',
//                     '--no-zygote',
//                     '--single-process',
//                     '--disable-gpu'
//                 ]
//             },
//             webVersionCache: {
//                 type: 'remote',
//                 remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
//             }
//         });

//         this.setupClientEvents();

//         this.client.on('auth_failure', (msg) => {
//             console.error('Authentication failed:', msg);
//         });
        
//         process.on('unhandledRejection', (reason, promise) => {
//             console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//         });
//     }

//     setupClientEvents() {
//         this.client.on('qr', (qr) => {
//             console.log(qr)
//             qrcode.generate(qr, { small: true });
//         });

//         this.client.on('ready', () => {
//             console.log('Client is ready!');
//         });

//         this.client.on('message', async (msg) => {
//             try {
//                 if (msg.from !== "status@broadcast") {
//                     const contact = await msg.getContact();
//                     console.log(contact, msg.body);
//                 }
//             } catch (error) {
//                 console.error('Message handling error:', error);
//             }
//         });

//         // Add error handling
//         this.client.on('disconnected', (reason) => {
//             console.log('Client was logged out', reason);
//             // Attempt to reinitialize
//             this.initialize();
//         });
//     }

//     initialize() {
//         try {
//             this.client.initialize();
//         } catch (error) {
//             console.error('Initialization error:', error);
//             // Retry initialization after a delay
//             setTimeout(() => this.initialize(), 5000);
//         }
//     }

//     sendMessage(phoneNumber, message) {
//         return this.client.sendMessage(phoneNumber, message);
//     }
    
// }

// module.exports = new WhatsappClient();


// const {Client, LocalAuth} = require('whatsapp-web.js')
// const qrcode = require('qrcode-terminal')

// const whatsappClient = new Client({
//     authStrategy: new LocalAuth
// })


// whatsappClient.on("qr", (qr)=> qrcode.generate(qr, {small: true}))
// whatsappClient.on("ready", ()=> console.log("Client is ready"))

// whatsappClient.on("message", async(msg)=> {
//     try{
//         if(msg.from != "status@broadcast"){
//             const contact = await msg.getContact()
//             console.log(contact, msg.body)
//         }

//     } catch (error){
//         console.log(error)
//     }
// })

// module.exports = whatsappClient