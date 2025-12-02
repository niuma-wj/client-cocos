// 游戏数据及状态管理者
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.22

import { sys, assetManager, ImageAsset, Texture2D, SpriteFrame } from "cc";
import { CommonUtils } from "../Utils/CommonUtils";
import { EnterVenueState } from "../Common/ConstDefines";
import { NetworkManager } from "./NetworkManager";
import { Client } from "../Game/Client";

export class GameManager {
    private static _instance: GameManager = null;

    public static get Instance(): GameManager {
        if (GameManager._instance == null) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }

    // HTTP服务器地址
    private httpHost: string = null;

    public get HttpHost(): string {
        return this.httpHost;
    }

    public set HttpHost(url: string) {
        this.httpHost = url;
    }

    // 背景音乐音量
    private musicVolume: number = 1.0;

    public get MusicVolume(): number {
        return this.musicVolume;
    }

    public set MusicVolume(vol: number) {
        this.musicVolume = vol;
    }

    // 音效音量
    private soundVolume: number = 1.0;

    public get SoundVolume(): number {
        return this.soundVolume;
    }

    public set SoundVolume(vol: number) {
        this.soundVolume = vol;
    }

    // 背景音乐是否静音
    private musicMute: boolean = false;

    public get MusicMute(): boolean {
        return this.musicMute;
    }

    public set MusicMute(mute: boolean) {
        this.musicMute = mute;
    }

    // 音效是否静音
    private soundMute: boolean = false;

    public get SoundMute(): boolean {
        return this.soundMute;
    }

    public set SoundMute(mute: boolean) {
        this.soundMute = mute;
    }

    public loadSetting() {
        let text = sys.localStorage.getItem("setting");
        let data: any = null;
        if (!text) return;
        data = JSON.parse(text);
        if (!data) return;
        this.musicVolume = data.musicVolume;
        this.soundVolume = data.soundVolume;
        this.musicMute = data.musicMute;
        this.soundMute = data.soundMute;

        //console.log(CommonUtils.generateRandomCode(10));
        //console.log(CommonUtils.encodeMD5("wujian"));
        //console.log(CommonUtils.encodeBase64("wujian"));
    }

    public saveSetting() {
        let data = {
            musicVolume: this.musicVolume,
            soundVolume: this.soundVolume,
            musicMute: this.musicMute,
            soundMute: this.soundMute
        };
        let text = JSON.stringify(data);
        sys.localStorage.setItem("setting", text);
    }

    // token
    private token: string = null;

    public get Token(): string {
        return this.token;
    }

    public set Token(token: string) {
        this.token = token;
    }

    // 玩家ID
    private playerId: string = null;

    public get PlayerId(): string {
        return this.playerId;
    }

     // 昵称
    private nickName: string = null;

    public get NickName(): string {
        return this.nickName;
    }

    // 电话
    private phone: string = null;

    public get Phone(): string {
        return this.phone;
    }

    // 0未知，1为男性，2为女性
    private sex: number = 0;

    public get Sex(): number {
        return this.sex;
    }

    // 头像url
    private avatar: string = null;

    public get Avatar(): string {
        return this.avatar;
    }

    // 消息密钥
    private secret: string = null;

    // 金币数量
    private gold: number = 0;

    public get Gold(): number {
        return this.gold;
    }

    public set Gold(gold: number) {
        this.gold = gold;
    }

    // 银行存款
    private deposit: number = 0;

    public get Deposit(): number {
        return this.deposit;
    }

    public set Deposit(deposit: number) {
        this.deposit = deposit;
    }

    // 钻石数量
    private diamond: number = 0;

    public get Diamond(): number {
        return this.diamond;
    }

    public set Diamond(diamond: number) {
        this.diamond = diamond;
    }

    // 是否为代理
    private isAgency: boolean = false;
    public get IsAgency(): boolean {
        return this.isAgency;
    }

    // 代理玩家id
    private agencyId: string = null;
    public get AgencyId(): string {
        return this.agencyId;
    }

    // 设置玩家信息的时间戳
    private playerInfoTime: number = 0;

    public get PlayerInfoTime(): number {
        return this.playerInfoTime;
    }

    public updatePlayerInfoTime(): void {
        this.playerInfoTime = sys.now();
    }

    public setPlayerInfo(dto: any) {
        this.playerId = dto.playerId;
        this.secret = dto.secret;
        this.nickName = dto.nickname;
        this.phone = dto.phone;
        this.sex = dto.sex;
        this.avatar = dto.avatar;
        this.gold = dto.gold;
        this.deposit = dto.deposit;
        this.diamond = dto.diamond;
        this.isAgency = dto.isAgency;
        this.agencyId = dto.agencyId;
        this.playerInfoTime = sys.now();
    }

    private clearPlayerInfo() {
        this.token = null;
        this.playerId = null;
        this.secret = null;
        this.nickName = null;
        this.phone = null;
        this.sex = 0;
        this.avatar = null;
        this.gold = 0;
        this.deposit = 0;
        this.diamond = 0;
        this.isAgency = false;
        this.agencyId = null;
        this.playerInfoTime = 0;
    }

    // 上次心跳时间，时间戳，单位毫秒
    private lastHeartbeat: number = 0;

    public heartbeat() {
        if (CommonUtils.isStringEmpty(this.token)) return;
        let nowTime: number = sys.now();
        let delta: number = nowTime - this.lastHeartbeat;
        if (delta < 30000) return;
        // 每30秒发送一次心跳
        this.lastHeartbeat = nowTime;
        let url = this.getUrl("/player/heartbeat");
        fetch(url, {
            method: 'GET',
            headers: { 'PLAYER-AUTHORIZATION': this.Token }
        }).then((response: Response) => {
            if (response.status === 401) {
                // token失效，重新登录
                this.token = null;
                let logoutFunc: (() => void) = () => {
                    this.clearPlayerInfo();
                    Client.Instance.logout();
                };
                Client.Instance.showPromptDialog("登录已失效，请重新登录", logoutFunc, logoutFunc);
            }
            //console.log("Heartbeat status: ", response.status);
        }).catch((err) => {
            console.log("Heartbeat error: ", err);
        });
    }

    public logout() {
        this.authPost("/player/logout", null);
        this.clearPlayerInfo();
        //sys.localStorage.removeItem('userData');
    }

    private getUrl(path): string {
        let url = null;
        if (path.startsWith('/')) {
            url = this.HttpHost + path;
        } else {
            url = this.HttpHost + '/' + path;
        }
        return url;
    }

    // 非鉴权Get请求
    public get(path): Promise<any> {
        if (CommonUtils.isStringEmpty(this.HttpHost)) return;
        let url = this.getUrl(path);
        return fetch(url).then((response: Response) => {
            return response.json();
        });
    }

    // 非鉴权Post请求
    public post(path, data): Promise<any> {
        if (CommonUtils.isStringEmpty(this.HttpHost)) return;
        let url = this.getUrl(path);
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify(data)
        }).then((response: Response) => {
            return response.json();
        });
    }

    // 鉴权Get请求
    public authGet(path): Promise<any> {
        if (CommonUtils.isStringEmpty(this.HttpHost)) return;
        if (CommonUtils.isStringEmpty(this.Token)) return;
        let url = this.getUrl(path);
        return fetch(url, {
            method: 'GET',
            headers: { 'PLAYER-AUTHORIZATION': this.Token }
        }).then((response: Response) => {
            return response.json();
        });
    }

    // 鉴权Post请求
    public authPost(path, data): Promise<any> {
        if (CommonUtils.isStringEmpty(this.HttpHost)) return;
        if (CommonUtils.isStringEmpty(this.Token)) return;
        let url = this.getUrl(path);
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'PLAYER-AUTHORIZATION': this.Token
            },
            body: data ? JSON.stringify(data) : null
        }).then((response: Response) => {
            return response.json();
        });
    }

    // 远程图像缓存表，例如头像图片，最多仅缓存10张图像
    private spriteMap: Map<string, SpriteFrame> = new Map<string, SpriteFrame>();

    // 远程图像加载顺序表
    private spriteUrls: Array<string> = new Array<string>();

    // 加载网络图片为SpriteFrame
    public loadSpriteFrame(url, onComplete: ((spriteFrame: SpriteFrame) => void)) {
        if (!url) return;
        if (this.spriteMap.has(url)) {
            this.moveUrlToEnd(url);
            onComplete(this.spriteMap.get(url));
            return;
        }
        assetManager.loadRemote(url, (err, image) => {
            if (err) {
                console.error(err);
                return;
            }
            if (image instanceof ImageAsset) {
                let texture = new Texture2D();
                texture.image = image;
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture as Texture2D;
                this.addSpriteFrame(url, spriteFrame);
                onComplete(spriteFrame);
            } else {
                console.log("The specified url is not image asset, ", url);
                console.log(image);
            }
        });
    }

    private addSpriteFrame(url: string, sf: SpriteFrame) {
        this.spriteMap.set(url, sf);
        this.spriteUrls.push(url);
        if (this.spriteUrls.length > 10) {
            // 缓存图像超过10张，删除最久不使用的那张
            for (let i = 0; i < this.spriteUrls.length; i++) {
                let tmpUrl: string = this.spriteUrls[i];
                if (tmpUrl === this.Avatar) continue;
                this.spriteMap.delete(tmpUrl);
                this.spriteUrls.splice(i, 1);
                break;
            }
        }
    }

    private moveUrlToEnd(url: string) {
        let index: number = this.spriteUrls.indexOf(url);
        if (index === -1 || index === (this.spriteUrls.length - 1)) return;
        this.spriteUrls.splice(index, 1);
        this.spriteUrls.push(url);
    }

    // 当前的进入场地状态
    private enterVenueState: EnterVenueState = EnterVenueState.Leaved;

    public get EnterVenueState(): EnterVenueState {
        return this.enterVenueState;
    }

    // 当前已进入的场地id，成功进入场地后该字段才会被设置
    private venueId: string = null;

    public get VenueId(): string {
        return this.venueId;
    }

    public set VenueId(venueId: string | null) {
        this.venueId = venueId;
    }

    // 当前正在进入的场地
    private enteringVenueId: string = null;

    // 当前正在进入的场地游戏类型
    private enteringGameType: number = 0;

    // 进入场地成功后的回调函数
    private enterCallback: (() => void) | null = null;

    /**
     * 进入场地
     * @param address 服务器地址
     * @param venueId 场地id
     * @param gameType 游戏类型
     * @param onEnterVenue 进入成功回调
     */
    public enterVenue(address: string, venueId: string, gameType: number, onEnterVenue: (() => void)) {
        console.log("Enter venue, server address: ", address, ", game type: ", gameType, ", id: ", venueId);
        this.enteringVenueId = venueId;
        this.enteringGameType = gameType;
        this.enterCallback = onEnterVenue;
        this.enterVenueState = EnterVenueState.Entering;
        NetworkManager.Instance.connect(address, false);
    }

    public onConnected() {
        if (this.enterVenueState === EnterVenueState.Entering) {
            // 正在进入场地，发送进入场地消息
            console.log("Enter venue: ", this.enteringVenueId);
            let msg = {
                venueId: this.enteringVenueId,
                gameType: this.enteringGameType
            };
            NetworkManager.Instance.sendMessage("MsgEnterVenue", msg, true);
        }
    }

    public onEnterVenue(venueId: string) {
        if (this.enterVenueState !== EnterVenueState.Entering) return;
        if (venueId !== this.enteringVenueId) return;

        console.log("Enter venue success, id: ", venueId, ", game type: ", this.enteringGameType);
        this.enterVenueState = EnterVenueState.Entered;
        this.venueId = venueId;
        this.enteringVenueId = null;
        this.enteringGameType = 0;
        if (this.enterCallback) {
            this.enterCallback();
            this.enterCallback = null;
        }
    }

    public onEnterFailed(venueId: string, errMsg: string) {
        if (this.enterVenueState !== EnterVenueState.Entering) return;
        if (venueId !== this.enteringVenueId) return;
        this.enterVenueState = EnterVenueState.Leaved;
        this.enteringVenueId = null;
        this.enteringGameType = 0;
        this.enterCallback = null;
        Client.Instance.showPromptDialog(errMsg);
    }

    public leaveVenue() {
        this.enterVenueState = EnterVenueState.Leaved;
        this.enteringVenueId = null;
        this.enteringGameType = 0;
        this.enterCallback = null;
        NetworkManager.Instance.abandon();
        Client.Instance.backToGameHall();
    }

    // 一分钟内生产的Nonce序列
    private nonceSequence: { timestamp: number, nonce: string }[] = [];

    // 一分钟内生产的Nonce表
    private nonces: Set<string> = new Set<string>();
    
    private generateNonce(timestamp: number): string {
        let delta: number = 0;
        let count: number = this.nonceSequence.length;
        while (count > 0) {
            let item = this.nonceSequence[0];
            delta = timestamp - item.timestamp;
            if (delta < 60) {
                break;
            }
            this.nonces.delete(item.nonce);
            this.nonceSequence.shift();
            count--;
        }
        let nonce: string = null;
        while (true) {
            nonce = CommonUtils.generateRandomCode(10);
            if (this.nonces.has(nonce)) {
                continue;
            }
            this.nonces.add(nonce);
            this.nonceSequence.push({ timestamp: timestamp, nonce: nonce });
            break;
        }
        return nonce;
    }

    /**
     * 消息签名
     * @param msg 未签名的消息体
     * @return 签名后的消息体
     */
    public signatureMessage(msg: any): any {
        if (!msg) return null;
        if (CommonUtils.isStringEmpty(this.secret)) return null;
        let timestamp: number = Math.floor(sys.now() / 1000);
        let nonce: string = this.generateNonce(timestamp);
        let text = this.playerId + '&' + timestamp.toString() + '&' + nonce + '&' + this.secret;
        let signedMsg = {
            ...msg,
            playerId: this.playerId,
            timestamp: timestamp.toString(),
            nonce: nonce,
            signature: CommonUtils.encodeMD5(text, false, false)
        };
        return signedMsg;
    }

    // 玩家消息签名失败，重新登录
    public onPlayerSignatureError(msg: any) {
        this.token = null;
        this.secret = null;
        let logoutFunc: (() => void) = () => {
            this.clearPlayerInfo();
            Client.Instance.logout();
        };
        Client.Instance.showPromptDialog("登录已失效，请重新登录", logoutFunc, logoutFunc);
    }

    public getCapital() {
        this.authGet("/player/capital/get").then((dto) => {
            if (dto.code === '00000000') {
                this.gold = dto.gold;
                this.deposit = dto.deposit;
                this.diamond = dto.diamond;
                this.playerInfoTime = sys.now();
            } else {
                console.log("Get capital error: ", dto.msg);
            }
        }).catch((err) => {
            console.log("Get capital error: ", err);
        });
    }
}
