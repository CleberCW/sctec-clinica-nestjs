import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private getEncryptionKey(): Buffer {
    const key = process.env.JWT_ENCRYPTION_KEY;

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

    console.log('JWT DESCRIPTOGRAFADO:', decrypted.toString('utf8'));

    return decrypted.toString('utf8');
  }

  sign(payload: object) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not set');
    }

    const token = sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
      issuer: 'sctec-nestjs',
    });

    return this.encrypt(token);
  }

  verify(encryptedToken: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not set');
    }

    const decryptedToken = this.decrypt(encryptedToken);

    return verify(decryptedToken, process.env.JWT_SECRET, {
      issuer: 'sctec-nestjs',
    });
  }
}
