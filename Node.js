const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path'); // 新增：处理路径

const app = express();
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 【关键修改 1】：开启静态文件访问
// 这样你访问域名时，Render 才知道去显示 index.html 和 qr.jpg
app.use(express.static('.')); 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const MY_QQ_EMAIL = '52395719@qq.com'; 
const MY_AUTH_CODE = 'nnetjjaplicibifd'; 

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, 
    auth: {
        user: MY_QQ_EMAIL,
        pass: MY_AUTH_CODE
    }
});

// 路由保持不变
app.post('/api/submit-order', upload.array('files', 10), async (req, res) => {
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

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// 【关键修改 2】：根路由指向 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 【关键修改 3】：兼容 Render 的动态端口
// Render 会通过环境变量 PORT 分配端口，必须监听 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
