const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const MY_QQ_EMAIL = '52395719@qq.com'; 
const MY_AUTH_CODE = 'nnetjjaplicibifd'; 

// 【核心抢救配置】：重新回到 465 端口，但加入极其宽松的握手等待
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, // 使用 SSL
    auth: {
        user: MY_QQ_EMAIL,
        pass: MY_AUTH_CODE
    },
    // 以下是针对海外服务器连接慢的“特效药”
    tls: {
        rejectUnauthorized: false, // 忽略证书校验，提高连接速度
        minVersion: 'TLSv1.2'      // 强制使用 TLS 1.2，防止协议协商失败
    },
    connectionTimeout: 30000,      // 连接超时增加到 30 秒
    greetingTimeout: 30000,        // 问候超时增加到 30 秒
    socketTimeout: 30000           // 数据传输超时增加到 30 秒
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/submit-order', upload.array('files', 10), async (req, res) => {
    console.log('收到请求，正在尝试建立与 QQ 邮箱服务器的连接...');
    try {
        const { raiseLayer, strokeLayer, userEmail, tradeNo, totalPrice } = req.body;
        const files = req.files;

        const attachments = files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        const mailOptions = {
            from: MY_QQ_EMAIL,
            to: MY_QQ_EMAIL,    
            subject: `【新订单】来自 ${userEmail}`,
            html: `<h3>新订单需求：</h3>
                   <p>邮箱：${userEmail}</p>
                   <p>凸起：${raiseLayer}</p>
                   <p>勾边：${strokeLayer}</p>
                   <p>价格：${totalPrice}元</p>
                   <p>单号后4位：${tradeNo}</p>`,
            attachments: attachments
        };

        // 执行发送
        await transporter.sendMail(mailOptions);
        console.log('✅ 邮件发送成功！');
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('❌ 发送失败原因:', error);
        res.status(500).json({ 
            success: false, 
            message: '发信超时，Render 服务器可能无法访问 QQ 邮箱接口',
            debug: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务已启动，监听端口: ${PORT}`);
});
