// AES加解密实用工具类
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.23

import CryptoJS from 'crypto-js';

export class AesUtils {
    // 16字节的密钥1
    private static key1: string = "Lc1Zi8481lfH0F72";

    // 16字节的初始化向量1
    private static iv1: string = "OkxNe6vsRD1d3vUe";

    // 16字节的密钥2
    private static key2: string = "73qaS4K1PcW4n9uN";

    // 16字节的初始化向量2
    private static iv2: string = "XcTyAJe8o1OGVlMo";

    public static encrypt1(plainText: string): string {
        return AesUtils.encryptImpl(plainText, AesUtils.key1, AesUtils.iv1);
    }

    public static  decrypt1(cipherText: string): string {
        return AesUtils.decryptImpl(cipherText, AesUtils.key1, AesUtils.iv1);
    }

    public static encrypt2(plainText: string): string {
        return AesUtils.encryptImpl(plainText, AesUtils.key2, AesUtils.iv2);
    }

    public static  decrypt2(cipherText: string): string {
        return AesUtils.decryptImpl(cipherText, AesUtils.key2, AesUtils.iv2);
    }

    private static encryptImpl(plainText: string, key: string, iv: string): string {
        // 加密数据
        let keyBuf = CryptoJS.enc.Utf8.parse(key);
        let ivBuf = CryptoJS.enc.Utf8.parse(iv);
        let encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plainText), keyBuf, {
            iv: ivBuf,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        // 将加密后的数据转换为Base64字符串，便于存储或传输
        return encrypted.toString();
    }

    private static decryptImpl(cipherText: string, key: string, iv: string): string {
        // 使用相同的密钥和初始向量来解密
        let keyBuf = CryptoJS.enc.Utf8.parse(key);
        let ivBuf = CryptoJS.enc.Utf8.parse(iv);
        let decrypted = CryptoJS.AES.decrypt(cipherText, keyBuf, {
            iv: ivBuf,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return CryptoJS.enc.Utf8.stringify(decrypted).toString();
    }
}


