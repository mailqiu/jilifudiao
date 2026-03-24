const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path'); // 用于处理文件路径

const app = express();

// 1. 基础配置
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 【关键】开启静态文件托管
// 这行代码让浏览器能够访问你文件夹里的 qr.jpg、style.css 等文件
app.use(express.static('.')); 

// 3. 文件上传配置 (内存存储)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 4. 邮件发送配置
const MY_QQ_EMAIL = '52395719@qq.com'; 
const MY_AUTH_CODE = 'nnetjjaplicibifd'; // 确保这是你最新的16位授权码

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, 
    auth: {
        user: MY_QQ_EMAIL,
        pass: MY_AUTH_CODE
    }
});

// 5. 【关键】根路由配置
// 当有人访问 https://royal-0hsp.onrender.com/ 时，给他们展示 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 6. 订单提交接口
app.post('/api/submit-order', upload.array('files', 10), async (req, res) => {
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

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: '订单已发送至邮箱' });
    } catch (error) {
        console.error('发送邮件失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

// 7. 【关键】监听端口配置
// Render 会自动分配 PORT 环境变量，必须优先使用它
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务已启动，正在监听端口: ${PORT}`);
});
