const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. 基础中间件配置
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 开启静态文件托管（确保能访问 index.html 和 qr.jpg）
app.use(express.static('.')); 

// 3. 文件上传配置 (内存存储)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 4. 邮件发送配置 (针对海外云服务器优化)
const MY_QQ_EMAIL = '52395719@qq.com'; 
const MY_AUTH_CODE = 'nnetjjaplicibifd'; // 确保这是最新的16位授权码

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,              // ✅ 切换到 587 端口以避免海外连接 465 端口超时
    secure: false,          // ✅ 587 端口需设置为 false
    auth: {
        user: MY_QQ_EMAIL,
        pass: MY_AUTH_CODE
    },
    // ✅ 增加 TLS 配置，提高跨国网络连接成功率
    tls: {
        rejectUnauthorized: false 
    }
});

// 5. 根路由：返回前端页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 6. 订单提交接口
app.post('/api/submit-order', upload.array('files', 10), async (req, res) => {
    console.log('收到新请求，正在处理...');
    try {
        const { raiseLayer, strokeLayer, userEmail, tradeNo, totalPrice } = req.body;
        const files = req.files;

        // 构建邮件附件
        const attachments = files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        const mailOptions = {
            from: MY_QQ_EMAIL,
            to: MY_QQ_EMAIL,    
            subject: `【新订单】来自 ${userEmail}`,
            html: `
                <h3>收到新的图层处理订单！</h3>
                <p><strong>客户邮箱：</strong> ${userEmail}</p>
                <p><strong>整体凸起：</strong> ${raiseLayer}</p>
                <p><strong>勾边浮雕：</strong> ${strokeLayer}</p>
                <p><strong>订单总价：</strong> ${totalPrice} 元</p>
                <p><strong>支付单号后4位：</strong> <span style="color:red;">${tradeNo}</span></p>
            `,
            attachments: attachments
        };

        // 发送邮件
        await transporter.sendMail(mailOptions);
        console.log('邮件发送成功！');
        res.status(200).json({ success: true, message: '订单已发送至邮箱' });

    } catch (error) {
        // ✅ 这里的错误会被打印到 Render 的 Logs 里
        console.error('发送邮件失败详情:', error);
        res.status(500).json({ 
            success: false, 
            message: '服务器发信失败，请检查授权码或稍后重试',
            error: error.message 
        });
    }
});

// 7. 端口配置 (Render 动态分配)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务已在端口 ${PORT} 启动`);
});
