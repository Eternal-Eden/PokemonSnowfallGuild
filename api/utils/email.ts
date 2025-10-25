/**
 * 邮件发送工具模块
 */
import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface VerificationEmailOptions {
  to: string;
  username: string;
  code: string;
}

/**
 * 创建邮件传输器
 */
const createTransporter = () => {
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    logger.warn('Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

/**
 * 发送邮件
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.error('Email transporter not available');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PokemonSnowfallGuild <noreply@pokemonguild.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}`, { messageId: result.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error: error instanceof Error ? error.message : error, to: options.to });
    return false;
  }
};

/**
 * 发送验证码邮件
 */
export const sendVerificationEmail = async (options: VerificationEmailOptions): Promise<boolean> => {
  const subject = '【宝可梦落雪公会】邮箱验证码';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>邮箱验证码</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .code {
                background: #fff;
                border: 2px dashed #667eea;
                padding: 20px;
                text-align: center;
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
                margin: 20px 0;
                border-radius: 8px;
                letter-spacing: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 14px;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎮 宝可梦落雪公会</h1>
            <p>欢迎加入我们的冒险之旅！</p>
        </div>
        <div class="content">
            <h2>你好，${options.username}！</h2>
            <p>感谢你注册宝可梦落雪公会！为了完成账户验证，请使用以下验证码：</p>
            
            <div class="code">${options.code}</div>
            
            <div class="warning">
                <strong>⚠️ 重要提醒：</strong>
                <ul>
                    <li>验证码有效期为 <strong>10分钟</strong></li>
                    <li>请勿将验证码泄露给他人</li>
                    <li>如果不是本人操作，请忽略此邮件</li>
                </ul>
            </div>
            
            <p>完成验证后，你将能够：</p>
            <ul>
                <li>🏠 访问公会论坛和频道</li>
                <li>🎯 参与各种活动和比赛</li>
                <li>👥 与其他训练师交流互动</li>
                <li>📊 展示你的宝可梦队伍</li>
            </ul>
        </div>
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>© 2024 宝可梦落雪公会 - 让我们一起成为最强的训练师！</p>
        </div>
    </body>
    </html>
  `;

  const text = `
    宝可梦落雪公会 - 邮箱验证码
    
    你好，${options.username}！
    
    感谢你注册宝可梦落雪公会！请使用以下验证码完成账户验证：
    
    验证码：${options.code}
    
    注意事项：
    - 验证码有效期为10分钟
    - 请勿将验证码泄露给他人
    - 如果不是本人操作，请忽略此邮件
    
    此邮件由系统自动发送，请勿回复。
    
    © 2024 宝可梦落雪公会
  `;

  return await sendEmail({
    to: options.to,
    subject,
    text,
    html
  });
};

/**
 * 发送密码重置邮件
 */
export const sendPasswordResetEmail = async (to: string, username: string, resetToken: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  
  const subject = '【宝可梦落雪公会】密码重置';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>密码重置</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 密码重置</h1>
        </div>
        <div class="content">
            <h2>你好，${username}！</h2>
            <p>我们收到了你的密码重置请求。点击下面的按钮来重置你的密码：</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">重置密码</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ 重要提醒：</strong>
                <ul>
                    <li>重置链接有效期为 <strong>1小时</strong></li>
                    <li>如果不是本人操作，请忽略此邮件</li>
                    <li>为了账户安全，请设置一个强密码</li>
                </ul>
            </div>
            
            <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
        </div>
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>© 2024 宝可梦落雪公会</p>
        </div>
    </body>
    </html>
  `;

  const text = `
    宝可梦落雪公会 - 密码重置
    
    你好，${username}！
    
    我们收到了你的密码重置请求。请访问以下链接来重置你的密码：
    
    ${resetUrl}
    
    注意事项：
    - 重置链接有效期为1小时
    - 如果不是本人操作，请忽略此邮件
    - 为了账户安全，请设置一个强密码
    
    此邮件由系统自动发送，请勿回复。
    
    © 2024 宝可梦落雪公会
  `;

  return await sendEmail({
    to,
    subject,
    text,
    html
  });
};

/**
 * 验证邮件配置
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed', { error: error instanceof Error ? error.message : error });
    return false;
  }
};