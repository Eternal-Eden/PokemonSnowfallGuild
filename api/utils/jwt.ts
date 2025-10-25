/**
 * JWT工具模块 - 支持RS256算法
 */
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  email?: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

interface TokenOptions {
  expiresIn?: string;
  algorithm?: 'RS256' | 'HS256';
}

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

// JWT密钥管理类
class JWTKeyManager {
  private static instance: JWTKeyManager;
  private keyPair: KeyPair | null = null;
  private legacySecret: string | null = null;

  private constructor() {
    this.loadKeys();
  }

  static getInstance(): JWTKeyManager {
    if (!JWTKeyManager.instance) {
      JWTKeyManager.instance = new JWTKeyManager();
    }
    return JWTKeyManager.instance;
  }

  private loadKeys(): void {
    try {
      // 加载RS256密钥对
      const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || './keys/jwt-private.pem';
      const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './keys/jwt-public.pem';
      
      const privateKeyFullPath = path.resolve(process.cwd(), privateKeyPath);
      const publicKeyFullPath = path.resolve(process.cwd(), publicKeyPath);

      if (fs.existsSync(privateKeyFullPath) && fs.existsSync(publicKeyFullPath)) {
        this.keyPair = {
          privateKey: fs.readFileSync(privateKeyFullPath, 'utf8'),
          publicKey: fs.readFileSync(publicKeyFullPath, 'utf8'),
        };
        logger.info('RS256 JWT密钥对加载成功');
      } else {
        logger.warn('RS256密钥文件不存在，将使用HS256算法');
      }

      // 加载传统密钥
      this.legacySecret = process.env.JWT_SECRET || null;
      if (this.legacySecret) {
        logger.info('HS256 JWT密钥加载成功');
      }
    } catch (error) {
      logger.error('JWT密钥加载失败:', error);
    }
  }

  getKeyPair(): KeyPair | null {
    return this.keyPair;
  }

  getLegacySecret(): string | null {
    return this.legacySecret;
  }

  hasRS256Keys(): boolean {
    return this.keyPair !== null;
  }

  hasLegacySecret(): boolean {
    return this.legacySecret !== null;
  }
}

/**
 * 生成JWT令牌 - 优先使用RS256算法
 */
export const generateToken = (
  payload: TokenPayload,
  options: TokenOptions = {}
): string => {
  const keyManager = JWTKeyManager.getInstance();
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '7d';
  const algorithm = options.algorithm || (keyManager.hasRS256Keys() ? 'RS256' : 'HS256');

  const tokenPayload = {
    id: payload.id,
    username: payload.username,
    role: payload.role,
    email: payload.email,
  };

  const signOptions: jwt.SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'pokemon-guild',
    audience: 'pokemon-guild-users',
    algorithm: algorithm as jwt.Algorithm,
  };

  try {
    if (algorithm === 'RS256') {
      const keyPair = keyManager.getKeyPair();
      if (!keyPair) {
        throw new Error('RS256密钥对未找到');
      }
      return jwt.sign(tokenPayload, keyPair.privateKey, signOptions);
    } else {
      const secret = keyManager.getLegacySecret();
      if (!secret) {
        throw new Error('JWT_SECRET环境变量未设置');
      }
      return jwt.sign(tokenPayload, secret, signOptions);
    }
  } catch (error) {
    logger.error('JWT令牌生成失败:', error);
    throw new Error('令牌生成失败');
  }
};

/**
 * 验证JWT令牌 - 自动检测算法类型
 */
export const verifyToken = (token: string): TokenPayload => {
  const keyManager = JWTKeyManager.getInstance();
  
  logger.debug('开始验证JWT令牌', { tokenLength: token.length, tokenPrefix: token.substring(0, 20) + '...' });
  
  // 检查令牌基本格式
  if (!token || typeof token !== 'string') {
    logger.error('令牌格式错误: 令牌为空或不是字符串', { token: typeof token });
    throw new Error('无效的令牌格式');
  }
  
  // 检查JWT格式（应该有三个部分用.分隔）
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    logger.error('令牌格式错误: JWT应该有三个部分', { parts: tokenParts.length, token: token.substring(0, 50) + '...' });
    throw new Error('无效的令牌格式');
  }
  
  // 解码令牌头部以确定算法
  let decoded: jwt.Jwt | null;
  try {
    const decodedResult = jwt.decode(token, { complete: true });
    if (typeof decodedResult === 'string' || !decodedResult) {
      throw new Error('令牌解码结果格式错误');
    }
    decoded = decodedResult;
  } catch (decodeError) {
    logger.error('令牌解码失败:', decodeError);
    throw new Error('无效的令牌格式');
  }
  
  if (!decoded || !decoded.header) {
    logger.error('令牌解码结果无效', { decoded: !!decoded, header: decoded?.header });
    throw new Error('无效的令牌格式');
  }

  const algorithm = decoded.header.alg;
  logger.debug('检测到令牌算法', { algorithm, header: decoded.header });
  
  const verifyOptions: jwt.VerifyOptions = {
    issuer: 'pokemon-guild',
    audience: 'pokemon-guild-users',
    algorithms: [algorithm as jwt.Algorithm],
  };

  try {
    let verifiedPayload: jwt.JwtPayload;

    if (algorithm === 'RS256') {
      const keyPair = keyManager.getKeyPair();
      if (!keyPair) {
        logger.error('RS256验证失败: 公钥未找到');
        throw new Error('RS256公钥未找到');
      }
      logger.debug('使用RS256算法验证令牌');
      verifiedPayload = jwt.verify(token, keyPair.publicKey, verifyOptions) as jwt.JwtPayload;
    } else if (algorithm === 'HS256') {
      const secret = keyManager.getLegacySecret();
      if (!secret) {
        logger.error('HS256验证失败: 密钥未找到');
        throw new Error('HS256密钥未找到');
      }
      logger.debug('使用HS256算法验证令牌');
      verifiedPayload = jwt.verify(token, secret, verifyOptions) as jwt.JwtPayload;
    } else {
      logger.error('不支持的算法', { algorithm });
      throw new Error(`不支持的算法: ${algorithm}`);
    }

    logger.debug('令牌验证成功', { 
      userId: verifiedPayload.id, 
      username: verifiedPayload.username,
      algorithm,
      exp: verifiedPayload.exp,
      iat: verifiedPayload.iat
    });

    return {
      id: verifiedPayload.id as string,
      username: verifiedPayload.username as string,
      role: verifiedPayload.role as string,
      email: verifiedPayload.email as string,
      iat: verifiedPayload.iat,
      exp: verifiedPayload.exp,
      iss: verifiedPayload.iss as string,
      aud: Array.isArray(verifiedPayload.aud) ? verifiedPayload.aud[0] : verifiedPayload.aud as string,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('令牌已过期', { algorithm, exp: typeof decoded.payload === 'object' ? decoded.payload?.exp : undefined });
      throw new Error('令牌已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.error('JWT验证错误', { 
        algorithm, 
        error: error.message,
        tokenPayload: decoded.payload 
      });
      throw new Error('无效令牌');
    } else {
      logger.error('令牌验证失败:', error);
      throw new Error('令牌验证失败');
    }
  }
};

/**
 * 生成刷新令牌
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const keyManager = JWTKeyManager.getInstance();
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  const algorithm = keyManager.hasRS256Keys() ? 'RS256' : 'HS256';

  const tokenPayload = {
    id: payload.id,
    username: payload.username,
    role: payload.role,
    email: payload.email,
  };

  const signOptions: jwt.SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'pokemon-guild',
    audience: 'pokemon-guild-refresh',
    algorithm: algorithm as jwt.Algorithm,
  };

  try {
    if (algorithm === 'RS256') {
      const keyPair = keyManager.getKeyPair();
      if (!keyPair) {
        throw new Error('RS256密钥对未找到');
      }
      return jwt.sign(tokenPayload, keyPair.privateKey, signOptions);
    } else {
      const secret = keyManager.getLegacySecret();
      if (!secret) {
        throw new Error('JWT_SECRET环境变量未设置');
      }
      return jwt.sign(tokenPayload, secret, signOptions);
    }
  } catch (error) {
    logger.error('刷新令牌生成失败:', error);
    throw new Error('刷新令牌生成失败');
  }
};

/**
 * 验证刷新令牌
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const keyManager = JWTKeyManager.getInstance();
  
  // 解码令牌头部以确定算法
  const decodedResult = jwt.decode(token, { complete: true });
  if (typeof decodedResult === 'string' || !decodedResult || !decodedResult.header) {
    throw new Error('无效的刷新令牌格式');
  }
  const decoded = decodedResult;

  const algorithm = decoded.header.alg;
  
  const verifyOptions: jwt.VerifyOptions = {
    issuer: 'pokemon-guild',
    audience: 'pokemon-guild-refresh',
    algorithms: [algorithm as jwt.Algorithm],
  };

  try {
    let verifiedPayload: jwt.JwtPayload;

    if (algorithm === 'RS256') {
      const keyPair = keyManager.getKeyPair();
      if (!keyPair) {
        throw new Error('RS256公钥未找到');
      }
      verifiedPayload = jwt.verify(token, keyPair.publicKey, verifyOptions) as jwt.JwtPayload;
    } else if (algorithm === 'HS256') {
      const secret = keyManager.getLegacySecret();
      if (!secret) {
        throw new Error('HS256密钥未找到');
      }
      verifiedPayload = jwt.verify(token, secret, verifyOptions) as jwt.JwtPayload;
    } else {
      throw new Error(`不支持的算法: ${algorithm}`);
    }

    return {
      id: verifiedPayload.id as string,
      username: verifiedPayload.username as string,
      role: verifiedPayload.role as string,
      email: verifiedPayload.email as string,
      iat: verifiedPayload.iat,
      exp: verifiedPayload.exp,
      iss: verifiedPayload.iss as string,
      aud: Array.isArray(verifiedPayload.aud) ? verifiedPayload.aud[0] : verifiedPayload.aud as string,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('刷新令牌已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('无效刷新令牌');
    } else {
      logger.error('刷新令牌验证失败:', error);
      throw new Error('刷新令牌验证失败');
    }
  }
};

/**
 * 从请求头中提取令牌
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * 解码令牌（不验证签名）
 */
export const decodeToken = (token: string): jwt.JwtPayload | null => {
  try {
    const decoded = jwt.decode(token);
    if (typeof decoded === 'string' || !decoded) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};