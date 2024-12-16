const express = require('express')
const router = new express.Router()
const whatsappClient = require('../services/WhatsappClient')
const fs = require('fs')
const path = require('path')

router.get('/', (req, res) => {
    res.send('WhatsApp API is running');
})

router.post('/message', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ 
                error: 'Phone number and message are required' 
            });
        }

        await whatsappClient.sendMessage(phoneNumber, message);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Message sending error:', error);
        res.status(500).json({ 
            error: 'Failed to send message', 
            details: error.message 
        });
    }
})

// Endpoint to get QR code status and image
router.get('/qr-code', (req, res) => {
    const qrCodePath = whatsappClient.getQRCodePath();
    
    if (fs.existsSync(qrCodePath)) {
        res.sendFile(qrCodePath);
    } else {
        res.status(404).json({ message: 'No QR code available' });
    }
})

module.exports = router
// const express = require('express')
// const router = new express.Router()
// const whatsappClient = require('../services/WhatsappClient')
// const fs = require('fs')

// router.get('/', (req, res) => {
//     res.send('Hello World!');
// })

// router.post('/message', (req, res) => {
//     whatsappClient.sendMessage(req.body.phoneNumber, req.body.message)
//     res.send()
// })

// // Endpoint to get QR code status and image
// router.get('/qr-code', (req, res) => {
//     const qrCodePath = whatsappClient.getQRCodePath();
    
//     if (fs.existsSync(qrCodePath)) {
//         res.sendFile(qrCodePath);
//     } else {
//         res.status(404).json({ message: 'No QR code available' });
//     }
// })

// module.exports = router

// const express = require('express')
// const router = new express.Router()
// const whatsappClient = require('../services/WhatsappClient')
// router.get('/',(req,res)=>{
//     res.send('Hello World!');

// })

// router.post('/message', (req, res) => {
//     whatsappClient.sendMessage(req.body.phoneNumber, req.body.message)
//     res.send()
// })
// module.exports = router
