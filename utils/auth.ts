import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateToken(apiKey: string): string {
  const [id, secret] = apiKey.split('.');
  
  if (!id || !secret) {
    throw new Error('Invalid API key format');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'HS256',
    sign_type: 'SIGN'
  };

  const payload = {
    api_key: id,
    exp: timestamp + 60 * 10,
    timestamp: timestamp
  };

  try {
    // Base64Url 编码 header 和 payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // 创建签名内容
    const signContent = `${encodedHeader}.${encodedPayload}`;

    // 使用 HMAC-SHA256 创建签名
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(signContent).digest('base64url');

    // 组合最终的 JWT
    return `${signContent}.${signature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
} 