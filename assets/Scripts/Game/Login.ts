// 登录和注册界面
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.22

import { _decorator, Component, EditBox, Label, Node, Sprite, sys, ImageAsset, Texture2D, SpriteFrame, Toggle, AudioClip } from 'cc';
import { ResourceLoader } from '../Manager/ResourceLoader';
import { AesUtils } from '../Utils/AesUtils';
import { CommonUtils } from '../Utils/CommonUtils';
import { Client } from './Client';
import { GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('Login')
export class Login extends Component {
    @property({ type: EditBox })
    private editName: EditBox = null;
        
    @property({ type: EditBox })
    private editPassword: EditBox = null;

    @property({ type: EditBox })
    private editCode: EditBox = null;

    @property({ type: Sprite })
    private spriteCode: Sprite = null;

    @property({ type: EditBox })
    private editNicknameReg: EditBox = null;

    @property({ type: EditBox })
    private editNameReg: EditBox = null;
        
    @property({ type: EditBox })
    private editPasswordReg1: EditBox = null;

    @property({ type: EditBox })
    private editPasswordReg2: EditBox = null;

    @property({ type: EditBox })
    private editCodeReg: EditBox = null;

    @property({ type: Sprite })
    private spriteCodeReg: Sprite = null;

    @property({ type: Toggle })
    private toggleMale: Toggle = null;

    @property({ type: Toggle })
    private toggleFemale: Toggle = null;

    @property({ type: Node })
    private loginGroup: Node = null;

    @property({ type: Node })
    private registerGroup: Node = null;

    private uuidCode: string = null;

    private sex: number = 1;

    start() {
        let text = sys.localStorage.getItem('userData');
        let userData = null;
        if (text) {
            text = AesUtils.decrypt2(text);
            userData = JSON.parse(text);
        }
        if (userData) {
            this.editName.string = userData.username;
            this.editPassword.string = userData.password;
            GameManager.Instance.Token = userData.token;
            this.getPlayerInfo();
        }
        this.getCaptchaCode1();
        this.playBackgroundMusic();
    }

    update(deltaTime: number) { }
    
    public playBackgroundMusic() {
        ResourceLoader.Instance.loadAsset("Login", "bg_login", AudioClip, (clip: AudioClip) => {
            Client.Instance.playBackgroundMusic(clip);
        });
    }
    
    private getCaptchaCode1() {
        this.getCaptchaCode((spriteFrame: SpriteFrame) => {
            this.spriteCode.spriteFrame = spriteFrame;
        });
    }

    private getCaptchaCode2() {
        this.getCaptchaCode((spriteFrame: SpriteFrame) => {
            this.spriteCodeReg.spriteFrame = spriteFrame;
        });
    }

    private getCaptchaCode(onGetaptchaCode: Function) {
        GameManager.Instance.get('/player/captcha-image').then((dto) => {
            this.uuidCode = dto.uuid;
            let base64Img = "data:image/jpg;base64," + dto.img;
            let image = new Image();
            image.onload = function() {
                let texture = new Texture2D();
                texture.image = new ImageAsset(image);
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                onGetaptchaCode(spriteFrame);
            }
            image.src = base64Img;
        }).catch((err) => {
            console.log("获取验证码失败");
        });
    }

    public onCodeClicked1() {
        this.editCode.string = "";
        this.getCaptchaCode1();
    }

    public onCodeClicked2() {
        this.editCodeReg.string = "";
        this.getCaptchaCode2();
    }

    public onLoginClicked() {
        if (CommonUtils.isStringEmpty(this.editName.string)) {
            Client.Instance.showPromptTip("请输入登录用户名");
            //Client.Instance.showPromptDialog("请输入登录用户名");
            return;
        }
        if (CommonUtils.isStringEmpty(this.editPassword.string)) {
            Client.Instance.showPromptTip("请输入密码");
            return;
        }
        if (CommonUtils.isStringEmpty(this.editCode.string)) {
            Client.Instance.showPromptTip("请输入验证码");
            return;
        }
        let data = {
            name: AesUtils.encrypt1(this.editName.string),
            password: AesUtils.encrypt1(this.editPassword.string),
            code: this.editCode.string,
            uuid: this.uuidCode
        };
        GameManager.Instance.post("/player/login", data).then((dto) => {
            if (dto.code === '00000000') {
                GameManager.Instance.Token = dto.token;
                let userData = {
                    username: this.editName.string,
                    password: this.editPassword.string,
                    token: dto.token
                };
                let text: string = JSON.stringify(userData);
                text = AesUtils.encrypt2(text);
                sys.localStorage.setItem('userData', text);
                this.getPlayerInfo();
            } else {
                this.getCaptchaCode1();
                Client.Instance.showPromptDialog("登录失败：" + dto.msg);
            }
        }).catch((err) => {
            this.getCaptchaCode1();
            console.log(err);
            Client.Instance.showPromptDialog("登录失败：" + err.toString());
        });
    }
    
    public onRegisterClicked1() {
        this.loginGroup.active = false;
        this.registerGroup.active = true;
        this.getCaptchaCode2();
    }

    public onRegisterClicked2() {
        if (CommonUtils.isStringEmpty(this.editNicknameReg.string)) {
            Client.Instance.showPromptTip("请输入昵称");
            return;
        }
        if (!CommonUtils.isUsernameValid(this.editNameReg.string)) {
            Client.Instance.showPromptTip("请输入合法用户名，用户名只能包含英文字母、数字、\"_\"及\"-\"，且长度至少为6个字符", 3);
            return;
        }
        if (CommonUtils.isStringEmpty(this.editPasswordReg1.string)) {
            Client.Instance.showPromptTip("请输入密码");
            return;
        }
        if (CommonUtils.isStringEmpty(this.editPasswordReg2.string)) {
            Client.Instance.showPromptTip("请输入确认密码");
            return;
        }
        if (this.editPasswordReg1.string !== this.editPasswordReg2.string) {
            Client.Instance.showPromptTip("两次输入的密码不一致");
            return;
        }
        if (CommonUtils.isStringEmpty(this.editCodeReg.string)) {
            Client.Instance.showPromptTip("请输入验证码");
            return;
        }
        let errMsg: string = CommonUtils.isPasswordValid(this.editPasswordReg1.string);
        if (!CommonUtils.isStringEmpty(errMsg)) {
            Client.Instance.showPromptTip(errMsg);
            return;
        }
        let data = {
            nickname: this.editNicknameReg.string,
            name: AesUtils.encrypt1(this.editNameReg.string),
            password: AesUtils.encrypt1(this.editPasswordReg1.string),
            sex: this.sex,
            code: this.editCodeReg.string,
            uuid: this.uuidCode
        };
        GameManager.Instance.post("/player/register", data).then((dto) => {
            if (dto.code === '00000000') {
                GameManager.Instance.Token = dto.token;
                Client.Instance.showPromptTip("注册成功");
                this.editName.string = this.editNameReg.string;
                this.editPassword.string = this.editPasswordReg1.string;
                this.onBackClicked();
            } else {
                this.getCaptchaCode2();
                Client.Instance.showPromptDialog("注册失败：" + dto.msg);
            }
        }).catch((err) => {
            this.getCaptchaCode2();
            console.log("Register error: ", err);
            Client.Instance.showPromptDialog("注册失败：" + err.toString());
        });
    }

    public onBackClicked() {
        this.loginGroup.active = true;
        this.registerGroup.active = false;
        this.getCaptchaCode1();
    }

    public onMaleToggle(event: Event) {
        if (!this.toggleMale.isChecked) return;
        this.sex = 1;
    }

    public onFemaleToggle(event: Event) {
        if (!this.toggleFemale.isChecked) return;
        this.sex = 2;
    }

    private getPlayerInfo() {
        GameManager.Instance.authGet("/player/info").then((dto) => {
            let errMsg: string = null;
            if (dto) {
                if (dto.code !== "00000000") {
                    errMsg = dto.msg;
                    if (!errMsg) {
                        errMsg = "unknown error";
                    }
                }
            } else {
                errMsg = "unknown error";
            }
            if (errMsg) {
                this.getCaptchaCode1();
                GameManager.Instance.Token = null;
                console.log("Get player info error: ", errMsg);
                return;
            }
            GameManager.Instance.setPlayerInfo(dto);
            Client.Instance.onLoginSucceed();
        }).catch((err) => {
            this.getCaptchaCode1();
            GameManager.Instance.Token = null;
            console.log("Get player info error: ", err);
        });
    }
}


