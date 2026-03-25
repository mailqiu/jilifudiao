const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // 必须有这行，图片才能显示

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const MY_QQ_EMAIL = '52395719@qq.com'; 
const MY_AUTH_CODE = 'nnetjjaplicibifd'; 

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: { user: MY_QQ_EMAIL, pass: MY_AUTH_CODE },
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    connectionTimeout: 45000,
    greetingTimeout: 45000
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.post('/api/submit-order', upload.array('files', 10), async (req, res) => {
    try {
        const { raiseLayer, strokeLayer, userEmail, tradeNo, totalPrice } = req.body;
        const files = req.files;
        const mailOptions = {
            from: MY_QQ_EMAIL,
            to: MY_QQ_EMAIL,    
            subject: `【订单】${userEmail} - ${totalPrice}元`,
            html: `<p>客户邮箱：${userEmail}</p><p>单号后4位：${tradeNo}</p><p>凸起：${raiseLayer}</p><p>勾边：${strokeLayer}</p>`,
            attachments: files.map(file => ({ filename: file.originalname, content: file.buffer }))
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('发信报错:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { console.log(`Run on ${PORT}`); });
