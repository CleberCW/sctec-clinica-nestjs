import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { JwtPayload, sign, verify } from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}
  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('JWT_ENCRYPTION_KEY');

    if (!key) {
      throw new Error('JWT_ENCRYPTION_KEY not set');
    }

    const buffer = Buffer.from(key, 'hex');

    if (buffer.length !== 32) {
      throw new Error('JWT_ENCRYPTION_KEY must be 32 bytes');
    }

    return buffer;
  }
  encrypt(payload: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);

    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(payload, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  decrypt(encryptedPayload: string): string {
    const key = this.getEncryptionKey();
    const [ivHex, authTagHex, encryptedHex] = encryptedPayload.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted payload');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    if (iv.length !== 12) {
      throw new Error('Invalid IV');
    }

    if (authTag.length !== 16) {
      throw new Error('Invalid authentication tag');
    }

    const decipher = createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  sign(payload: object) {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET not set');
    }

    const token = sign(payload, secret, {
      expiresIn: '8h',
      issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
    });

    return this.encrypt(token);
  }

  verify(encryptedToken: string): JwtPayload {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');

    const decryptedToken = this.decrypt(encryptedToken);

    const payload = verify(decryptedToken, secret, {
      issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
    });

    if (typeof payload === 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }

    return payload;
  }
}
