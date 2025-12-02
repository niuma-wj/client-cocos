// 通用实用工具类
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.24

import CryptoJS from 'crypto-js';
import { Base64 } from 'js-base64';

export class CommonUtils {
    private static readonly CapitalLetters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static readonly LowercaseLetters: string = "abcdefghijklmnopqrstuvwxyz";
    private static readonly Numbers: string = "0123456789";
    private static readonly SpecialLetters: string = "!#$%&()*+,-./";


    public static isStringEmpty(str: string | null | undefined): boolean {
        return !str || str === "";
    }

    public static isUsernameValid(username: string): boolean {
        if (CommonUtils.isStringEmpty(username)) return false;
        if (username.length < 6) return false;
        let lowerA: number = 'a'.codePointAt(0);
        let lowerZ: number = 'z'.codePointAt(0);
        let upperA: number = 'A'.codePointAt(0);
        let upperZ: number = 'Z'.codePointAt(0);
        let zero: number = '0'.codePointAt(0);
        let nine: number = '9'.codePointAt(0);
        for (let i = 0; i < username.length; i++) {
            let charCode: number = username.codePointAt(i);
            if (charCode >= lowerA && charCode <= lowerZ)
                continue;
            if (charCode >= upperA && charCode <= upperZ)
                continue;
            if (charCode >= zero && charCode <= nine)
                continue;
            if (username[i] === '_' || username[i] === '-')
                continue;
            return false;
        }
        return true;
    }

    public static isPasswordValid(password: string): string {
        if (CommonUtils.isStringEmpty(password)) return "密码为空";
        if (password.length < 6) return "密码长度小于6个字符";
        let lowerA = 'a'.charCodeAt(0);
        let lowerZ = 'z'.charCodeAt(0);
        let upperA = 'A'.charCodeAt(0);
        let upperZ = 'Z'.charCodeAt(0);
        let zero = '0'.charCodeAt(0);
        let nine = '9'.charCodeAt(0);
        let specialLetters = {};
        let test1: boolean = false;
        let test2: boolean = false;
        let test3: boolean = false;
        for (let c of CommonUtils.SpecialLetters) {
            specialLetters[c] = true;
        }
        for (let i: number = 0; i < password.length; i++) {
            let charCode = password.charCodeAt(i);
            if ((charCode >= lowerA && charCode <= lowerZ) ||
                (charCode >= upperA && charCode <= upperZ)) {
                test1 = true;
                continue;
            }
            if (charCode >= zero && charCode <= nine) {
                test2 = true;
                continue;
            }
            if (specialLetters[password[i]]) {
                test3 = true;
                continue;
            }
            return "密码包含非法字符";
        }
        let types:number = 0;
        if (test1)
            types++;
        if (test2)
            types++;
        if (test3)
            types++;
        /*if (types < 2) {
            return "密码必须包含字母、数字、特殊符号中的两种";
        }*/
        return null;
    }

    //
    public static readonly CODE_CAPITAL: number = 0x01;

    //
    public static readonly CODE_LOWERCASE: number = 0x02;

    //
    public static readonly CODE_NUMBER: number = 0x04;

    //
    public static readonly CODE_ALL: number = (0x01 | 0x02 | 0x04);

    /**
     * 返回在[min, max)范围内的随机整数
     * @param min 最小值，包含
     * @param max 最大值，不包含
     * @returns 在[min, max)范围内的随机整数
     */
    public static generateRandomInt(min: number, max: number): number | undefined {
        min = Math.floor(min);
        max = Math.floor(max);
        let delta: number = max - min;
        if (delta < 1) return undefined;
        return Math.floor(Math.random() * delta) + min;
    }

    public static generateRandomCode(length: number, codeMask: number = CommonUtils.CODE_ALL): string {
        if (length < 1) {
            return null;
        }
        let types: number = 0;
        let arr: string[] = [];
        if ((codeMask & CommonUtils.CODE_CAPITAL) != 0) {
            arr.push(CommonUtils.CapitalLetters);
            types++;
        }
        if ((codeMask & CommonUtils.CODE_LOWERCASE) != 0) {
            arr.push(CommonUtils.LowercaseLetters);
            types++;
        }
        if ((codeMask & CommonUtils.CODE_NUMBER) != 0) {
            arr.push(CommonUtils.Numbers);
            types++;
        }
        if (types === 0) {
            return null;
        }
        let code: string = "";
        for (let i: number = 0; i < length; i++) {
            let idx1: number = CommonUtils.generateRandomInt(0, types);
            let characters: string = arr[idx1];
            let idx2: number = CommonUtils.generateRandomInt(0, characters.length);
            code += characters.charAt(idx2);
        }
        return code;
    }

    /**
     * 对输入字符串进行MD5编码
     * @param input 输入字符串
     * @param len16 是否为16位长度，否则为32位
     * @param capital 是否返回大写MD5字符串
     * @returns 返回md5字符串
     */
    public static encodeMD5(input: string, len16: boolean = false, capital: boolean = false): string {
        let hash: string = CryptoJS.MD5(input).toString();
        if (len16) {
            // 截取前16位
            hash = hash.substr(0, 16);
        }
        if (capital) {
            // 转换为大写
            hash = hash.toUpperCase();
        }
        return hash;
    }

    public static encodeBase64(text: string): string {
        if (!text) return null;
        let base64: string = Base64.encode(text);
        return base64;
    }

    public static decodeBase64(base64: string): string {
        if (!base64) return null;
        let text: string = Base64.decode(base64);
        return text;
    }

    /**
     * 格式化整数到字符串
     * @param num 整数
     * @param digits 位数，不足左边补0
     */
    public static formatInteger(num: number, digits: number | undefined): string {
        let ret = num.toString();
        if (!isNaN(digits)) {
            if (ret.length < digits) {
                let cnt = digits - ret.length;
                for (let i: number = 0; i < cnt; i++) {
                    ret = "0" + ret;
                }
            }
        }
        return ret;
    }
}
