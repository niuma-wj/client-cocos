import { _decorator, Component, Label, Node, Prefab, instantiate, Sprite, SpriteFrame, math, tween, animation, Quat } from 'cc';
import { NetMsgHandler, NetMsgManager } from '../../Manager/NetMsgManager';
import { ConnectionHandler, NetworkManager } from '../../Manager/NetworkManager';
import { GameManager } from '../../Manager/GameManager';
import { VoiceRecord, VoiceManager } from '../../Manager/VoiceManager';
import { Base64 } from 'js-base64';
import { Client } from '../Client';
import { CommonUtils } from '../../Utils/CommonUtils';
import { PlayCardFailed } from '../../Common/ConstDefines';
import { Poker } from '../../Common/Poker';
import { ResourceLoader } from '../../Manager/ResourceLoader';
import { SeatPanel } from './SeatPanel';
import { GuanDanPlayer } from './GuanDanPlayer';
import { CardPlayedOut } from './CardPlayedOut';
import { CardLayout } from './CardLayout';
import { AudioControl } from './AudioControl';
import { DlgResult } from './DlgResult';
import { DlgDisband } from './DlgDisband';

const { ccclass, property } = _decorator;

enum RoomLevel {
    // 无效
    Invalid = 0,

    // 好友房
    Friend = 1,

    // 练习房
    Practice = 2,

    // 初级房
    Beginner = 3,

    // 中级房
    Moderate = 4,

    // 高级房
    Advanced = 5,
    
    // 大师房
    Master = 6
}

enum GameState {
    // 等待玩家入座
    Sitting = 0,

    // 等待游戏开始
    Waiting = 1,

    // 正在发牌
    Dealing = 2,

    // 游戏正在进行中
    Playing = 3
}

@ccclass('GuanDanRoom')
export class GuanDanRoom extends Component implements NetMsgHandler, ConnectionHandler {
    @property({ type: AudioControl })
    private audioCtrl: AudioControl = null;

    @property({ type: Label })
    private labelLevel: Label = null;

    @property({ type: Node })
    private seatLayer: Node = null;

    @property({ type: Node })
    private desktopLayer: Node = null;

    @property({ type: Node })
    private desktopUILayer: Node = null;

    @property({ type: Node })
    private btnChat: Node = null;

    @property({ type: Node })
    private btnVoice: Node = null;

    @property({ type: Node })
    private btnStartGame: Node = null;

    @property({ type: Node })
    private btnReady: Node = null;

    @property({ type: Node })
    private readyGroup: Node = null;

    @property({ type: Node })
    private autoGroup: Node = null;

    @property({ type: [SeatPanel] })
    private seatPanels: SeatPanel[] = [];

    @property({ type: [GuanDanPlayer] })
    private players: GuanDanPlayer[] = [];

    @property({ type: [Node] })
    private playerBodySlots: Node[] = [];

    @property({ type: [Node] })
    private readyFlags: Node[] = [];

    @property({ type: Node })
    private spectatorFlag: Node = null;

    @property({ type: CardPlayedOut })
    private playedOut: CardPlayedOut = null;

    @property({ type: CardLayout })
    private layout: CardLayout = null;

    @property({ type: Node })
    private cardBacks: Node = null;

    @property({ type: [Node] })
    private touYous: Node[] = [];
    
    @property({ type: [Node] })
    private erYous: Node[] = [];

    @property({ type: Node })
    private clockArrow: Node = null;
    
    @property({ type: Node })
    private clockDirection1: Node = null;
    
    @property({ type: Node })
    private clockDirection2: Node = null;

    @property({ type: Label })
    private clockSecond: Label = null;

    @property({ type: Node })
    private passGroup: Node = null;

    @property({ type: Node })
    private playGroup: Node = null;

    @property({ type: Label })
    private textRed: Label = null;

    @property({ type: Label })
    private textBlue: Label = null;

    @property({ type: Node })
    private indicatorRed: Node = null;
    
    @property({ type: Node })
    private indicatorBlue: Node = null;

    @property({ type: Label })
    private gradePointText: Label = null;

    @property({ type: Node })
    private gradePointGroup: Node = null;

    @property({ type: Node })
    private btnPresent: Node = null;
    
    @property({ type: Node })
    private btnRefund: Node = null;

    @property({ type: Node })
    private refundTribute: Node = null;

    @property({ type: Label })
    private textRefundTip: Label = null;

    @property({ type: Sprite })
    private presentCard: Sprite = null;

    @property({ type: [SpriteFrame] })
    private memeImages: SpriteFrame[] = [];

    @property({ type: Node })
    private dlgChat: Node = null;

    @property({ type: DlgResult })
    private dlgResult: DlgResult = null;

    @property({ type: Node })
    private dlgSetting: Node = null;

    @property({ type: DlgDisband })
    private dlgDisband: DlgDisband = null;
    
    // 房号
    private roomNumber: string = null;

    // 等级
    private level: number = 0;

    // 房主座位号
    private ownerSeat: number = 0;

    // 游戏状态
    private gameState: number = GameState.Sitting;

    // 本玩家座位号
    private seat: number = -1;

    // 玩家信息
    private playerInfos: any[] = new Array(4);

    // 玩家身体
    private playerBodies: Node[] = new Array(4);

    // 当前是否正显示一局结果
    public showResult: boolean = false;

    // 当前是否在倒计时
    private clockFlag: boolean = false;

    //
    private clockSelf: boolean = false;

    // 已倒计时多久
    private clockElapsed: number = 0.0;

    //
    private dlgDisbanding: boolean = false;

    protected onLoad(): void {
        NetMsgManager.Instance.registerHandler(this);
        NetworkManager.Instance.registerHandler(this);
    }

    protected onDestroy(): void {
        NetMsgManager.Instance.unregisterHandler(this);
        NetworkManager.Instance.unregisterHandler(this);
    }

    start() {
        if (this.layout) this.layout.setRoom(this);
        for (let i: number = 0; i < 4; i++) {
            if (this.seatPanels[i]) this.seatPanels[i].setData(i, this);
        }
        if (this.dlgResult) this.dlgResult.setRoom(this);
        ResourceLoader.Instance.loadAsset("GuanDanRoomMain", "PromptDialog", Prefab, (prefab: Prefab) => {
            Client.Instance.setPromptDialogPrefab(prefab);
        });
        ResourceLoader.Instance.loadAsset("GuanDanRoomMain", "PromptTip", Prefab, (prefab: Prefab) => {
            Client.Instance.setPromptTipPrefab(prefab);
        });
        // 请求同步掼蛋游戏数据
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanSync");
    }

    update(deltaTime: number) {
        this.updateClock(deltaTime);
    }

    private updateClock(deltaTime: number) {
        if (!this.clockFlag) return;
        if (this.clockElapsed < 15.0) {
            let tmp: number = this.clockElapsed;
            this.clockElapsed = this.clockElapsed + deltaTime;
            let sec = 15.0 - this.clockElapsed;
            if (sec < 0) {
                sec = 0.0;
            }
            sec = Math.floor(sec);
            if (this.clockSecond) {
                this.clockSecond.string = sec.toString();
            }
            if (this.clockSelf) {
                let count: number = -1;
                if (tmp < 9.0) {
                    if (this.clockElapsed >= 9.0) {
                        count = 5;
                    }
                }
                else if (tmp < 10.0) {
                    if (this.clockElapsed >= 10.0) {
                        count = 4;
                    }
                }
                else if (tmp < 11.0) {
                    if (this.clockElapsed >= 11.0) {
                        count = 3;
                    }
                }
                else if (tmp < 12.0) {
                    if (this.clockElapsed >= 12.0) {
                        count = 2;
                    }
                }
                else if (tmp < 13.0) {
                    if (this.clockElapsed >= 13.0) {
                        count = 1;
                    }
                    else if (tmp < 14.0) {
                        if (this.clockElapsed >= 14.0) {
                            count = 0;
                        }
                    }
                }
                if ((count !== -1) && this.audioCtrl) {
                    this.audioCtrl.playCountdown(count);
                }
            }
        }
        else {
            this.clockFlag = false;
            this.clockSecond.string = "0";
        }
    }

    public onDisconnect(): void {}

    public onReconnect(): void {
        // 请求同步掼蛋游戏数据
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanSync");
    }

    public onMessage(msgType: string, msg: any): boolean {
        let ret: boolean = true;
        if (msgType === "MsgGuanDanSyncResp") this.onSyncGame(msg);
        else if (msgType === "MsgAddSpectator") this.onAddSpectator(msg);
        else if (msgType === "MsgAddAvatar") this.onAddAvatar(msg);
        else if (msgType === "MsgRemoveAvatar") this.onRemoveAvatar(msg);
        else if (msgType === "MsgAvatarConnect") this.onAvatarConnect(msg);
        else if (msgType === "MsgRemoveSpectator") this.onRemoveSpectator(msg);
        else if (msgType === "MsgPlayerReadyResp") this.onPlayerReady(msg);
        else if (msgType === "MsgPlayerAuthorizeResp") this.onPlayerAuthorize(msg);
        else if (msgType === "MsgTipText") this.onTipText(msg);
        else if (msgType === "MsgGuanDanSitting") this.onSitting(msg);
        else if (msgType === "MsgGuanDanOwnerSeat") this.onOwnerSeat(msg);
        else if (msgType === "MsgJoinGameResp") this.onJoinGame(msg);
        else if (msgType === "MsgBecomeSpectatorResp") this.onBecomeSpectator(msg);
        else if (msgType === "MsgChatServer") this.onChatServer(msg);
        else if (msgType === "MsgVoiceServer") this.onVoiceServer(msg);
        else if (msgType === "MsgLeaveVenueResp") this.onLeaveVenueResp(msg);
        else if (msgType === "MsgGuanDanStartGameResp") this.onStartGameResp(msg);
        else if (msgType === "MsgGuanDanGradePoint") this.onGradePoint(msg);
        else if (msgType === "MsgGuanDanDealCard") this.onDealCard();
        else if (msgType === "MsgGuanDanHandCard") this.onHandCard(msg);
        else if (msgType === "MsgGuanDanCardNums") this.onCardNums(msg);
        else if (msgType === "MsgResistTribute") this.onResistTribute(msg);
        else if (msgType === "MsgWaitPresentTribute") this.onWaitPresentTribute(msg);
        else if (msgType === "MsgPresentTributeResult") this.onPresentTributeResult(msg);
        else if (msgType === "MsgWaitRefundTribute") this.onWaitRefundTribute(msg);
        else if (msgType === "MsgRefundTributeResult") this.onRefundTributeResult(msg);
        else if (msgType === "MsgTributeComplete") this.onTributeComplete(msg);
        else if (msgType === "MsgGuanDanWaitPlayCard") this.onWaitPlayCard(msg);
        else if (msgType === "MsgGuanDanPlayCard") this.onPlayCard(msg);
        else if (msgType === "MsgGuanDanPlayCardFailed") this.onPlayCardFailed(msg);
        else if (msgType === "MsgGuanDanHintCardResp") this.onHintCardResp(msg);
        else if (msgType === "MsgGuanDanCardAlert") this.onCardAlert(msg);
        else if (msgType === "MsgGuanDanClearPlayedOut") this.onClearPlayedOut(msg);
        else if (msgType === "MsgGuanDanFinished") this.onFinished(msg);
        else if (msgType === "MsgGuanDanJieFeng") this.onJieFeng(msg);
        else if (msgType === "MsgGuanDanResult") this.onResult(msg);
        else if (msgType === "MsgPlayerDiamonds") this.onPlayerDiamonds(msg);
        else if (msgType === "MsgGuanDanDisbandVote") this.onDisbandVote(msg);
        else if (msgType === "MsgDisbandChoice") this.onDisbandChoice(msg);
        else if (msgType === "MsgDisbandObsolete") this.onDisbandObsolete();
        else if (msgType === "MsgDisband") this.onDisband();
        else ret = false;
        /*if (ret) {
            console.log("onMessage type: ", msgType);
        }*/
        return ret;
    }

    private onSyncGame(msg: any) {
        if (!msg) return;
        this.clearRoom();
        if (this.labelLevel) {
            if (msg.level === RoomLevel.Friend) this.labelLevel.string = "好友房(" + msg.number + ")";
            else if (msg.level === RoomLevel.Practice) this.labelLevel.string = "练习房";
            else if (msg.level === RoomLevel.Beginner) this.labelLevel.string = "初级房";
            else if (msg.level === RoomLevel.Moderate) this.labelLevel.string = "中级房";
            else if (msg.level === RoomLevel.Advanced) this.labelLevel.string = "高级房";
            else if (msg.level === RoomLevel.Master) this.labelLevel.string = "大师房";
            else this.labelLevel.string = null;
        }
        this.roomNumber = msg.number;
        this.level = msg.level;
        this.ownerSeat = msg.ownerSeat;
        this.gameState = msg.gameState;
        this.seat = msg.seat;
        let flag: boolean = false;
        if (this.gameState === GameState.Sitting) {
            // 显示入座界面
            flag = true;
            if (this.spectatorFlag) this.spectatorFlag.active = (this.seat === -1);
        }
        if (!flag && (this.seat === -1)) {
            // 当前为游戏状态，观众必须立即离开房间
            this.exitRoom();
        }
        else {
            if (this.seatLayer) this.seatLayer.active = flag;
            if (this.desktopLayer) this.desktopLayer.active = !flag;
            if (this.desktopUILayer) this.desktopUILayer.active = !flag;
            if (this.btnChat) this.btnChat.active = (this.seat !== -1);
            if (this.btnVoice) this.btnVoice.active = (this.seat !== -1);
            if (this.level === RoomLevel.Friend) {
                if (this.btnStartGame && (this.seat !== -1)) {
                    this.btnStartGame.active = (this.seat === this.ownerSeat);
                }
            }
        }
        if (this.readyGroup) this.readyGroup.active = (this.gameState === GameState.Waiting);
    }

    private clearRoom() {
        for (let i: number = 0; i < 4; i++) {
            if (this.seatPanels[i]) this.seatPanels[i].setEmpty();
            if (this.playerBodies[i]) {
                this.playerBodies[i].destroy();
                this.playerBodies[i] = null;
            }
            if (this.players[i]) {
                this.players[i].clear();
                this.players[i].show(false);
            }
        }
        if (this.playedOut) this.playedOut.clear();
        if (this.cardBacks) this.cardBacks.active = false;
        if (this.layout) this.layout.clear();
        for (let i: number = 0; i < 4; i++) {
            if (this.readyFlags[i]) this.readyFlags[i].active = false;
        }
        if (this.btnReady) this.btnReady.active = false;
        for (let i: number = 0; i < 4; i++) {
            if (this.touYous[i]) this.touYous[i].active = false;
            if (this.erYous[i]) this.erYous[i].active = false;
        }
        this.clockFlag = false;
        if (this.clockDirection2) this.clockDirection2.active = false;
        if (this.clockArrow) this.clockArrow.active = false;
        if (this.passGroup) this.passGroup.active = false;
        if (this.playGroup) this.playGroup.active = false;
        if (this.autoGroup) this.autoGroup.active = false;
        if (this.textRed) this.textRed.string = "";
        if (this.textBlue) this.textBlue.string = "";
        if (this.indicatorRed) this.indicatorRed.active = false;
        if (this.indicatorBlue) this.indicatorBlue.active = false;
        if (this.btnPresent) this.btnPresent.active = false;
        if (this.btnRefund) this.btnRefund.active = false;
    }

    private exitRoom() {
        GameManager.Instance.leaveVenue();
        GameManager.Instance.getCapital();
        Client.Instance.backToGameHall();
    }

    private server2ClientSeat(s: number): number {
        if (this.seat === -1) return s;
        if (this.gameState === GameState.Sitting) return s;
        let clientSeat: number = s + 4 - this.seat;
        clientSeat %= 4;
        return clientSeat;
    }

    private client2ServerSeat(s: number): number {
        if (this.seat === -1) return s;
        if (this.gameState === GameState.Sitting) return s;
        let seat: number = (s + this.seat) % 4;
        return seat;
    }

    private onAddSpectator(msg: any) { }

    private onAddAvatar(msg: any) {
        if (!msg) return;
        let count: number = msg.avatars.length;
        let isWaiting: boolean = (this.gameState === GameState.Waiting);
        for (let i: number = 0; i < count; i++) {
            let info = msg.avatars[i];
            let text: string = CommonUtils.decodeBase64(info.base64);
            let extraInfo = JSON.parse(text);
            let total: number = extraInfo.winNum + extraInfo.loseNum + extraInfo.drawNum;
            let winRate: number = 100.0;
            if (total > 0) winRate = (extraInfo.winNum + extraInfo.drawNum) * 100.0 / total;
            let playerInfo = {
                playerId: info.playerId,
                nickname: info.nickname,
                sex: info.sex,
                gold: extraInfo.gold,
                headUrl: info.headUrl,
                offline: info.offline,
                ready: info.ready,
                authorize: extraInfo.authorize,
                ip: extraInfo.ip,
                winNum: extraInfo.winNum,
                loseNum: extraInfo.loseNum,
                drawNum: extraInfo.drawNum,
                winRate: winRate
            };
            this.playerInfos[info.seat] = playerInfo;
            if (this.gameState === GameState.Sitting) {
                if (this.seatPanels[info.seat]) {
                    let isSelf: boolean = (info.seat === this.seat);
                    let isOwner: boolean = (info.seat === this.ownerSeat);
                    this.seatPanels[info.seat].setPlayerInfo(playerInfo, isSelf, isOwner);
                }
            }
            else {
                let clientSeat: number = this.server2ClientSeat(info.seat);
                if (this.playerBodySlots[clientSeat]) {
                    let prefabName: string = (info.sex === 1) ? "PlayerBoy" : "PlayerGirl";
                    ResourceLoader.Instance.loadAsset("GuanDanRoomMain", prefabName, Prefab, (prefab: Prefab) => {
                        if (!prefab) return;
                        this.playerBodies[clientSeat] = instantiate(prefab);
                        this.playerBodies[clientSeat].parent = this.playerBodySlots[clientSeat];
                    });
                }
                if (this.players[clientSeat]) {
                    this.players[clientSeat].show(true);
                    this.players[clientSeat].setPlayerInfo(playerInfo);
                }
                if (isWaiting && this.readyFlags[clientSeat]) {
                    this.readyFlags[clientSeat].active = info.ready;
                }
                if (clientSeat === 0) {
                    if (isWaiting && this.btnReady) {
                        this.btnReady.active = !info.ready;
                    }
                    if (this.autoGroup) {
                        this.autoGroup.active = playerInfo.authorize;
                    }
                }
            }
        }
    }

    private onRemoveAvatar(msg: any) {
        if (!msg) return;
        if (msg.seat === this.seat) this.seat = -1;
        this.playerInfos[msg.seat] = null;
        if (this.gameState === GameState.Sitting) {
            if (this.seatPanels[msg.seat]) this.seatPanels[msg.seat].setEmpty();
        }
        else {
            let clientSeat: number = this.server2ClientSeat(msg.seat);
            if (this.playerBodies[clientSeat]) {
                this.playerBodies[clientSeat].destroy();
                this.playerBodies[clientSeat] = null;
            }
            if (this.players[clientSeat]) {
                this.players[clientSeat].clear();
                this.players[clientSeat].show(false);
            }
            let isWaiting: boolean = (this.gameState === GameState.Waiting);
            if (isWaiting && this.readyFlags[clientSeat]) this.readyFlags[clientSeat].active = false;
        }
    }

    private onAvatarConnect(msg: any) {
        if (!msg) return;
        console.log(msg);
        if (this.playerInfos[msg.seat]) this.playerInfos[msg.seat].offline = msg.offline;
        if (this.gameState === GameState.Sitting) {
            if (this.seatPanels[msg.seat]) this.seatPanels[msg.seat].setOffline(msg.offline);
        }
        else {
            let clientSeat: number = this.server2ClientSeat(msg.seat);
            if (this.players[clientSeat]) this.players[clientSeat].setOffline(msg.offline);
        }
    }

    private onRemoveSpectator(msg: any) { }
    
    public onReadyClick() {
        if (this.seat === -1) return;
        NetworkManager.Instance.sendInnerMessage("MsgPlayerReady");
    }

    private onPlayerReady(msg: any) {
        if (!msg) return;
        if (this.playerInfos[msg.seat]) this.playerInfos[msg.seat].ready = true;
        if (this.gameState === GameState.Sitting) {
            if (this.seatPanels[msg.seat]) this.seatPanels[msg.seat].setReady(true);
        }
        else {
            let clientSeat: number = this.server2ClientSeat(msg.seat);
            if (this.readyFlags[clientSeat]) this.readyFlags[clientSeat].active = true;
            if (clientSeat === 0 && this.btnReady) this.btnReady.active = false;
        }
    }

    public onAutoClick() {
        NetworkManager.Instance.sendInnerMessage("MsgPlayerAuthorize");
    }

    private onPlayerAuthorize(msg: any) {
        if (!msg) return;
        if (this.playerInfos[msg.seat]) this.playerInfos[msg.seat].authorize = msg.authorize;
        if (this.gameState !== GameState.Sitting) {
            let clientSeat: number = this.server2ClientSeat(msg.seat);
            if (this.players[clientSeat]) this.players[clientSeat].setAuto(msg.authorize);
            if (clientSeat === 0 && this.autoGroup) this.autoGroup.active = msg.authorize;
        }
    }

    public showPlayerInfo(seat: number) {

    }

    public kickOutPlayer(seat: number) {

    }

    private onTipText(msg: any) {
        if (msg) Client.Instance.showPromptTip(msg.tip, 3.0);
    }

    private onSitting(msg: any) {
        if (this.showResult) return;
        if (!msg) return;
        this.gameState = msg.gameState;
        let flag: boolean = false;
        if (this.gameState === GameState.Sitting) flag = true;
        if (!flag && this.seat === -1) {
            // 由入座状态变为游戏状态，观众必须立即离开房间
            Client.Instance.showPromptDialog("游戏已开始，未入座玩家被请出房间。", this.exitRoom, this.exitRoom);
        }
        else {
            this.seatLayer.active = flag;
            this.desktopLayer.active = !flag;
            this.desktopUILayer.active = !flag;
            this.resetPlayers();
        }
    }

    private resetPlayers() {
        if (this.gameState === GameState.Sitting) {
            // 显示入座界面
            for (let i: number = 0; i < 4; i++) {
                if (!this.seatPanels[i]) continue;
                if (this.playerInfos[i]) {
                    let isSelf: boolean = (i === this.seat);
                    let isOwner: boolean = (i === this.ownerSeat);
                    this.seatPanels[i].setPlayerInfo(this.playerInfos[i], isSelf, isOwner);
                }
                else {
                    this.seatPanels[i].setEmpty();
                }
            }
        }
        else {
            // 显示入游戏(牌桌)界面
            let isWaiting: boolean = (this.gameState === GameState.Waiting);
            for (let i: number = 0; i < 4; i++) {
                if (this.playerBodies[i]) {
                    this.playerBodies[i].destroy();
                    this.playerBodies[i] = null;
                }
                let idx = this.client2ServerSeat(i);
                let playerInfo: any = this.playerInfos[idx];
                if (this.playerBodySlots[i] && playerInfo) {
                    let prefabName: string = (playerInfo.sex === 1) ? "PlayerBoy" : "PlayerGirl";
                    ResourceLoader.Instance.loadAsset("GuanDanRoomMain", prefabName, Prefab, (prefab: Prefab) => {
                        if (!prefab) return;
                        this.playerBodies[i] = instantiate(prefab);
                        this.playerBodies[i].parent = this.playerBodySlots[i];
                    });
                }
                if (this.players[i]) {
                    if (playerInfo) {
                        this.players[i].show(true);
                        this.players[i].setPlayerInfo(playerInfo);
                        this.players[i].setReady(isWaiting && playerInfo.ready);
                    }
                    else {
                        this.players[i].clear();
                        this.players[i].show(false);
                    }
                }
                if (i === 0 && this.autoGroup) {
                    let authorize = false;
                    if (playerInfo) authorize = playerInfo.authorize;
                    this.autoGroup.active = authorize;
                }
            }
        }
    }

    private onOwnerSeat(msg: any) {
        if (!msg) return;
        this.ownerSeat = msg.ownerSeat;
        if (this.ownerSeat === -1) return;
        if (this.gameState !== GameState.Sitting) return;
        if (this.seatPanels[this.ownerSeat]) this.seatPanels[this.ownerSeat].setOwnerSeat(true);
        if (this.level === RoomLevel.Friend) {
            if (this.btnStartGame && (this.seat !== -1)) this.btnStartGame.active = (this.seat === this.ownerSeat);
        }
    }

    private onJoinGame(msg: any) {
        if (!msg) return;
        if (msg.success) {
            // 加入游戏(入座)成功
            this.seat = msg.seat;
            if (this.spectatorFlag) this.spectatorFlag.active = false;
            if (this.btnChat) this.btnChat.active = true;
            if (this.btnVoice) this.btnVoice.active = true;
        }
        else {
            Client.Instance.showPromptTip(msg.errMsg, 2.0);
        }
    }

    // 响应点击换桌按钮
    public onChangeSeatClick() {
        NetworkManager.Instance.sendInnerMessage("MsgBecomeSpectator");
    }

    private onBecomeSpectator(msg: any) {
        if (!msg) return;
        if (msg.result === 0) {
            // 离开座位成功
            this.seat = -1;
            if (this.spectatorFlag) this.spectatorFlag.active = true;
            if (this.btnStartGame) this.btnStartGame.active = false;
            if (this.btnChat) this.btnChat.active = false;
            if (this.btnVoice) this.btnVoice.active = false;
        }
        else {
            Client.Instance.showPromptTip(msg.errMsg, 3.0);
        }
    }

    public OnSeatPanelClick(event: Event, customEventData: any | null) {
        let idx: number = Number(customEventData);
        if (isNaN(idx)) return;
        if (idx < 0 || idx > 3) return;
        if (!this.playerInfos[idx]) {
            if (this.seat === -1) {
                // 尚未坐下，尝试入座
                let msg = {
                    venueId: GameManager.Instance.VenueId,
                    seat: idx
                };
                NetworkManager.Instance.sendMessage("MsgJoinGame", msg, true);
            }
        }
        else if (this.seatPanels[idx]) {
            this.seatPanels[idx].showMenu(true);
        }
        else {
            Client.Instance.showPromptTip("您当前已经在其他座位坐下", 3.0);
        }
    }

    public onChatClicked() {
        if (this.dlgChat) this.dlgChat.active = true;
    }

    private onChatServer(msg: any) {
        if (!msg) return;
        let clientSeat: number = this.server2ClientSeat(msg.seat);
        if (this.gameState === GameState.Sitting) {
            if (this.seatPanels[clientSeat]) {
                if (msg.type === 1) {
                    this.seatPanels[clientSeat].setChatEmoji(msg.index);
                }
                else if (msg.type === 2) {
                    this.seatPanels[clientSeat].setChatPhrase(msg.index);
                    if (this.audioCtrl) {
                        let sex: number = this.playerInfos[msg.seat].sex;
                        this.audioCtrl.playPhrase((sex === 1), clientSeat, msg.index);
                    }
                }
                else if (msg.type === 3) {
                    this.seatPanels[clientSeat].setChatText(msg.text);
                }
                else if (msg.type === 4) {
                    this.seatPanels[clientSeat].setChatMeme(this.memeImages[msg.index]);
                }
            }
        }
        else if (this.players[clientSeat]) {
            if (msg.type === 1) {
                this.players[clientSeat].setChatEmoji(msg.index);
            }
            else if (msg.type === 2) {
                this.players[clientSeat].setChatPhrase(msg.index);
                if (this.audioCtrl) {
                    let sex: number = this.playerInfos[msg.seat].sex;
                    this.audioCtrl.playPhrase((sex === 1), clientSeat, msg.index);
                }
            }
            else if (msg.type === 3) {
                this.players[clientSeat].setChatText(msg.text);
            }
            else if (msg.type === 4) {
                this.players[clientSeat].setChatMeme(this.memeImages[msg.index]);
            }
        }
    }

    private onVoiceServer(msg: any) {
        if (!msg) return;
        let rec: VoiceRecord = new VoiceRecord();
        rec.data = Base64.toUint8Array(msg.base64);
        rec.onPlayStart = () => { this.onVoicePlayStart(msg.seat, msg.playerId); };
        rec.onPlayEnd = () => { this.onVoicePlayEnd(msg.seat, msg.playerId); };
        VoiceManager.Instance.addRecord(rec);
    }

    private onVoicePlayStart(seat: number, playerId: string) {
        //console.log("onVoicePlayStart");
        let clientSeat: number = this.server2ClientSeat(seat);
        if (this.gameState === GameState.Sitting) {
            if (this.seatPanels[clientSeat]) this.seatPanels[clientSeat].showChatTalk(true);
        }
        else if (this.players[clientSeat]) {
            this.players[clientSeat].showChatTalk(true);
        }
    }

    private onVoicePlayEnd(seat: number, playerId: string) {
        //console.log("onVoicePlayEnd");
        let clientSeat: number = this.server2ClientSeat(seat);
        if (this.gameState === GameState.Sitting) {
            if (this.seatPanels[clientSeat]) this.seatPanels[clientSeat].showChatTalk(false);
        }
        else if (this.players[clientSeat]) {
            this.players[clientSeat].showChatTalk(false);
        }
    }

    public onStartGameClick() {
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanStartGame");
    }

    // 请求退出房间
    public onBackClick() {
        if (NetworkManager.Instance.isConnected()) {
            NetworkManager.Instance.sendInnerMessage("MsgLeaveVenue");
        }
        else {
            this.exitRoom();
        }
    }

    public onSettingClick() {
        if (this.dlgSetting) this.dlgSetting.active = true;
    }

    public onShowDesktopDown(event: Event, customEventData: any | null) {
        if (!this.layout) return;
        let canvas: Sprite = this.layout.getComponent(Sprite);
        if (!canvas) return;
        tween(canvas).to(0.2, { color: new math.Color(255, 255, 255, 50) }, { easing: 'linear' }).start();
    }

    public onShowDesktopUp(event: Event, customEventData: any | null) {
        if (!this.layout) return;
        let canvas: Sprite = this.layout.getComponent(Sprite);
        if (!canvas) return;
        tween(canvas).to(0.2, { color: new math.Color(255, 255, 255, 255) }, { easing: 'linear' }).start();
    }

    public onTongHuaShunClick() {
        if (this.gameState !== GameState.Playing) return;
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanHintStraightFlush");
    }

    public onColumnClick() {
        if (this.layout) {
            this.layout.makeOneColumn();
        }
    }

    public onUndoClick() {
        if (this.layout) {
            this.layout.resetColumns();
        }
    }

    private onLeaveVenueResp(msg: any) {
        if (!msg) return;
        if (msg.result === 0) {
            // 离开成功，直接退出
            this.exitRoom();
        }
        else if (msg.result === 1) {
            // 离开失败，请求解散
            NetworkManager.Instance.sendInnerMessage("MsgDisbandRequest");
        }
        else {
            // 其他错误且无法解散，提示
            Client.Instance.showPromptTip(msg.errMsg, 3.0);
        }
    }

    private onStartGameResp(msg: any) {
        if (!msg) return;
        if (msg.result !== 0) {
            Client.Instance.showPromptTip(msg.errMsg, 3.0);
        }
    }

    private onGradePoint(msg: any) {
        if (!msg) return;
        if (this.textRed) this.textRed.string = Poker.getPointName(msg.gradePointRed);
        if (this.textBlue) this.textBlue.string = Poker.getPointName(msg.gradePointBlue);
        if (this.indicatorRed) this.indicatorRed.active = (msg.banker === 1);
        if (this.indicatorBlue) this.indicatorBlue.active = (msg.banker === 2);
        if (!msg.realTime) return;
        let point: number = 2;
        if (msg.banker === 1) point = msg.gradePointRed;
        else if (msg.banker === 2) point = msg.gradePointBlue;
        let text = "本局打" + Poker.getPointName(point);
        if (this.gradePointText) this.gradePointText.string = text;
        if (this.gradePointGroup) {
            this.gradePointGroup.active = true;
            this.gradePointGroup.scale = new math.Vec3(0, 0, 1);
            tween(this.gradePointGroup)
                .to(0.2, { scale: new math.Vec3(1, 1, 1) }, { easing: 'backOut' })
                .delay(2.5)
                .to(0.2, { scale: new math.Vec3(0, 0, 1) }, { easing: 'backIn' })
                .call(() => { this.onShowComplete(); })
                .start();
        }
    }

    private onShowComplete() {
        if (this.gradePointGroup) this.gradePointGroup.active = false;
    }

    private onDealCard() {
        this.gameState = GameState.Dealing;
        if (this.readyGroup) this.readyGroup.active = false;
        if (!this.cardBacks) return;
        this.cardBacks.active = true;
        let animator: animation.AnimationController = this.cardBacks.getComponent(animation.AnimationController);
        if (animator) {
            animator.setValue("DealCard", true);
        }
        if (this.audioCtrl) {
            this.audioCtrl.playStart();
        }
    }

    private onHandCard(msg: any) {
        if (!msg) return;
        this.gameState = GameState.Playing;
        if (this.cardBacks) this.cardBacks.active = false;
        if (this.layout) {
            this.layout.setHandCards(msg.cards, msg.gradePoint, msg.contributeId);
        }
    }

    private onCardNums(msg: any) {
        if (!msg) return;
        let clientSeat: number = this.server2ClientSeat(msg.seat);
        if (this.players[clientSeat]) {
            let isEnemy: boolean = (clientSeat === 1) || (clientSeat === 3);
            this.players[clientSeat].setLeftCardNum(msg.nums, isEnemy);
        }
    }

    private onResistTribute(msg: any) {
        if (!msg) return;
        Client.Instance.showPromptTip(msg.tip, 3.0);
        if (!this.playedOut) return;
        let clientSeat: number = -1;
        if (msg.seat1 !== -1) {
            clientSeat = this.server2ClientSeat(msg.seat1);
            this.playedOut.showFlag(clientSeat, 2);
        }
        if (msg.seat2 !== -1) {
            clientSeat = this.server2ClientSeat(msg.seat2);
            this.playedOut.showFlag(clientSeat, 2);
        }
    }

    private onWaitPresentTribute(msg: any) {
        if (!msg) return;
        Client.Instance.showPromptTip(msg.tip, 4.0);
        if (msg.seat1 === -1 && msg.seat2 === -1) {
            if (this.clockDirection2) {
                this.clockDirection2.active = false;
            }
            return;
        }
        // 各方向的旋转角度
        let rotateAngles = [90.0, 180.0, 270.0, 0.0];
        if (this.clockArrow) {
            this.clockArrow.active = true;
            this.clockFlag = true;
            this.clockElapsed = msg.elapsed;
        }
        let clientSeat: number = -1;
        this.clockSelf = false;
        if (msg.seat1 !== -1) {
            clientSeat = this.server2ClientSeat(msg.seat1);
            if (clientSeat === 0) {
                this.clockSelf = true;
            }
            if (this.clockDirection1) {
                let quat = new math.Quat();
                math.Quat.fromAngleZ(quat, rotateAngles[clientSeat]);
                this.clockDirection1.rotation = quat;
            }
        }
        if (msg.seat2 !== -1) {
            clientSeat = this.server2ClientSeat(msg.seat2);
            if (clientSeat === 0) {
                this.clockSelf = true;
            }
            if (this.clockDirection2) {
                this.clockDirection2.active = true;
                let quat = new math.Quat();
                math.Quat.fromAngleZ(quat, rotateAngles[clientSeat]);
                this.clockDirection2.rotation = quat;
            }
        }
        else if (this.clockDirection2) {
            this.clockDirection2.active = false;
        }
        if (this.btnPresent) {
            this.btnPresent.active = this.clockSelf;
        }
    }

    private onPresentTributeResult(msg: any) {
        if (!msg) return;
        if (!msg.success) {
            Client.Instance.showPromptTip(msg.errMsg, 4.0);
            return;
        }
        if (this.btnPresent) this.btnPresent.active = false;
        if (this.layout) {
            let cardIds: number[] = [msg.cardId];
            this.layout.removeCards(cardIds);
        }
    }

    public onPresentClick() {
        let ids: number[] = [];
        this.layout.getSelectedCardIds(ids);
        if (ids.length !== 1) {
            Client.Instance.showPromptTip("请选择一张除逢人配外最大的牌作为进贡的牌", 4.0);
            return;
        }
        let msg = {
            venueId: GameManager.Instance.VenueId,
            cardId: ids[0]
        };
        NetworkManager.Instance.sendMessage("MsgPresentTribute", msg, true);
    }

    private onWaitRefundTribute(msg: any) {
        if (!msg) return;
        if (msg.seat1 === -1 && msg.seat2 === -1) {
            if (this.clockDirection2) this.clockDirection2.active = false;
            return;
        }
        // 各方向的旋转角度
        let rotateAngles: number[] = [90.0, 180.0, 270.0, 0.0];
        if (this.clockArrow) {
            this.clockArrow.active = true;
            this.clockFlag = true;
            this.clockElapsed = msg.elapsed;
        }
        let clientSeat: number = -1;
        this.clockSelf = false;
        if (msg.seat1 !== -1) {
            clientSeat = this.server2ClientSeat(msg.seat1);
            if (clientSeat === 0) this.clockSelf = true;
            if (this.clockDirection1) {
                let quat = new math.Quat();
                math.Quat.fromAngleZ(quat, rotateAngles[clientSeat]);
                this.clockDirection1.rotation = quat;
            }
        }
        if (msg.seat2 !== -1) {
            clientSeat = this.server2ClientSeat(msg.seat2);
            if (clientSeat === 0) this.clockSelf = true;
            if (this.clockDirection2) {
                this.clockDirection2.active = true;
                let quat = new math.Quat();
                math.Quat.fromAngleZ(quat, rotateAngles[clientSeat]);
                this.clockDirection2.rotation = quat;
            }
        }
        else if (this.clockDirection2) {
            this.clockDirection2.active = false;
        }
        if (this.refundTribute) {
            this.refundTribute.active = this.clockSelf;
        }
        if (this.btnRefund) {
            this.btnRefund.active = this.clockSelf;
        }
        if (this.clockSelf) {
            if (this.textRefundTip) this.textRefundTip.string = msg.tip;
            if (this.presentCard) {
                let spriteFrame: SpriteFrame = null;
                if (this.layout) {
                    spriteFrame = this.layout.getCardSprite(msg.cardIn);
                }
                this.presentCard.spriteFrame = spriteFrame;
            }
        }
        else {
            Client.Instance.showPromptTip(msg.tip, 4.0);
        }
    }

    private onRefundTributeResult(msg: any) {
        if (!msg) return;
        if (msg.success) {
            if (this.refundTribute) this.refundTribute.active = false;
            if (this.btnRefund) this.btnRefund.active = false;
        }
        else {
            Client.Instance.showPromptTip(msg.errMsg, 4.0);
        }
    }

    private onTributeComplete(msg: any) {}

    public onRefundClick() {
	let ids: number[] = [];
        this.layout.getSelectedCardIds(ids);
        if (ids.length !== 1) {
            Client.Instance.showPromptTip("请选择一张小于或等于10的牌作为还贡牌", 4.0);
            return;
        }
        let msg = {
            venueId: GameManager.Instance.VenueId,
            cardId: ids[0]
        };
        NetworkManager.Instance.sendMessage("MsgRefundTribute", msg, true);
    }

    private onWaitPlayCard(msg: any) {
        if (!msg) return;
        let clientSeat: number = this.server2ClientSeat(msg.seat);
        if (this.playedOut) {
            this.playedOut.clearCards(clientSeat);
        }
        // 各方向的旋转角度
        let rotateAngles: number[] = [90.0, 180.0, 270.0, 0.0];
        if (this.clockArrow) {
            this.clockArrow.active = true;
            this.clockFlag = true;
            this.clockSelf = clientSeat === 0;
            this.clockElapsed = msg.elapsed;
            if (this.clockDirection1) {
                let quat = new math.Quat();
                math.Quat.fromAngleZ(quat, rotateAngles[clientSeat]);
                this.clockDirection1.rotation = quat;
            }
        }
        if (clientSeat === 0) {
            if (this.passGroup) this.passGroup.active = !(msg.firstPlay);
            if (this.playGroup) this.playGroup.active = msg.canPlay;
            if (this.layout) this.layout.unselectAll();
        }
        else {
            if (this.passGroup) this.passGroup.active = false;
            if (this.playGroup) this.playGroup.active = false;
        }
    }

    public onPassClick() {
        let msg = {
            venueId: GameManager.Instance.VenueId,
            pass: true
        };
        NetworkManager.Instance.sendMessage("MsgGuanDanDoPlayCard", msg, true);
    }

    public onPlayClick() {
        if (!this.layout) return;
        let ids: number[] = [];
        this.layout.getSelectedCardIds(ids);
        if (ids.length === 0) {
            Client.Instance.showPromptTip("未选中任何牌", 3.0);
            return;
        }
        let msg = {
            venueId: GameManager.Instance.VenueId,
            pass: false,
            cardIds: ids
        };
        NetworkManager.Instance.sendMessage("MsgGuanDanDoPlayCard", msg, true);
    }

    public onHintClick() {
        if (this.gameState !== GameState.Playing) return;
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanHintCard");
    }

    public resetHintCard() {
        if (this.gameState !== GameState.Playing) return;
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanResetHintCard");
    }

    private onPlayCard(msg: any) {
        if (!msg) return;
        let clientSeat = this.server2ClientSeat(msg.seat);
        if (this.playedOut) {
            if (msg.pass) {
                this.playedOut.showFlag(clientSeat, 1);
            }
            else {
                this.playedOut.playCards(clientSeat, msg.cards);
            }
        }
        if (this.layout && !(msg.pass)) {
            let cardIds: number[] = [];
            for (let i: number = 0; i < msg.cards.length; i++) {
                cardIds.push(msg.cards[i].id);
            }
            this.layout.removeCards(cardIds);
        }
	    if (!(msg.realTime)) return;
        if (this.audioCtrl) {
            let sex: number = 0;
            if (this.playerInfos[msg.seat]) {
                sex = this.playerInfos[msg.seat].sex;
            }
            if (msg.pass) {
                this.audioCtrl.playPass((sex === 1), clientSeat);
            }
            else {
                this.audioCtrl.playGenre((sex === 1), clientSeat, msg.genre, msg.cards[0], msg.firstPlay);
            }
        }
    }

    private onPlayCardFailed(msg) {
        if (!msg) return;
        let text: string = null;
        if (msg.reason === PlayCardFailed.CanNotPass) text = "必须出牌";
        else if (msg.reason === PlayCardFailed.NotFound) text = "出牌失败，找不到指定的牌";
        else if (msg.reason === PlayCardFailed.Invalid) text = "出牌失败，当前选中的牌不能组成有效牌型";
        else if (msg.reason === PlayCardFailed.CanNotPlay) text = "出牌失败，请选择更大的牌型";
        else text = "出牌失败，未知错误";
        Client.Instance.showPromptTip(text, 4.0);
    }

    private onHintCardResp(msg: any) {
        if (!msg) return;
        if (this.layout) {
            this.layout.setSelectedCardIds(msg.cardIds);
        }
    }

    private onCardAlert(msg: any) {
        if (!msg) return;
        if (this.audioCtrl) {
            this.audioCtrl.playAlert();
        }
    }

    private onClearPlayedOut(msg: any) {
        if (!msg) return;
        let clientSeat: number = this.server2ClientSeat(msg.seat);
        if (this.playedOut) {
            this.playedOut.clearCards(clientSeat);
        }
    }

    private onFinished(msg: any) {
        if (!msg) return;
        let clientSeat: number = -1;
        if (msg.touYou !== -1) {
            clientSeat = this.server2ClientSeat(msg.touYou);
            if (this.touYous[clientSeat]) {
                this.touYous[clientSeat].active = true;
            }
        }
        if (msg.erYou !== -1) {
            clientSeat = this.server2ClientSeat(msg.erYou);
            if (this.erYous[clientSeat]) {
                this.erYous[clientSeat].active = true;
            }
        }
    }

    private onJieFeng(msg: any) {
        if (!msg) return;
        if (!this.playerInfos[msg.seat]) return;
        let name: string = this.playerInfos[msg.seat].nickname;
        let text: string = "玩家【" + name + "】借风出牌";
        Client.Instance.showPromptTip(text, 3.0);
    }

    /**
     * 获取指定服务端座位号的友家座位号
     * @param seat 指定服务端座位号
     * @return 返回友家服务端座位号
    */
    private getFriendSeat(seat: number): number {
        return (seat + 2) % 4;
    }

    /**
     * 判定两个服务度端座位号是否为友家
     * @param seat1 服务端座位号1
     * @param seat2 服务端座位号2
     * @return 两个座位号为友家-true，否则-false
    */
    private isFriend(seat1: number, seat2: number): boolean {
        if (seat1 === seat2) return true;
        return (seat2 === this.getFriendSeat(seat1));
    }

    private onResult(msg: any) {
        if (!msg) return;
        this.gameState = GameState.Waiting;
        if (!this.dlgResult) return;
        this.showResult = true;
        this.dlgResult.show(true);
        this.dlgResult.setOwner(this.ownerSeat === this.seat);
        let seat1 = msg.finishedSeats[0];
        for (let i: number = 0; i < 4; i++) {
            let playerData = {};
            let seat: number = msg.finishedSeats[i];
            let clientSeat: number = this.server2ClientSeat(seat);
            if (this.players[clientSeat]) {
                playerData["headTexture"] = this.players[clientSeat].getTexture();
            }
            if (this.playerInfos[seat]) {
                playerData["nickname"] = this.playerInfos[seat].nickname;
                playerData["gold"] = this.playerInfos[seat].gold;
            }
            playerData["isWin"] = this.isFriend(seat1, seat);
            playerData["isFriend"] = this.isFriend(this.seat, seat);
            playerData["isKicked"] = msg.kicks[seat];
            this.dlgResult.setPlayer(i, playerData, (this.seat === seat));
        }
        this.dlgResult.setGradePoint(Poker.getPointName(msg.gradePointNext));
        this.dlgResult.startCountDown();
    }

    private onPlayerDiamonds(msg: any) {}

    private onDisbandVote(msg: any) {
        if (!(msg && this.dlgDisband)) return;
        this.dlgDisbanding = true;
        this.dlgDisband.show(true);
        let names: string[] = new Array(4);
        for (let i: number = 0; i < 4; i++) {
            if (this.playerInfos[i]) {
                names[i] = this.playerInfos[i].nickname;
            }
        }
        this.dlgDisband.onDisbandVote(msg, names, this.seat);
    }

    private onDisbandChoice(msg: any) {
        if (!(msg && this.dlgDisband)) return;
        console.log(msg);
        this.dlgDisband.onDisbandChoice(msg.seat, this.seat, msg.choice);
    }

    private onDisbandObsolete() {
        this.dlgDisbanding = false;
        if (this.dlgDisband) {
            this.dlgDisband.show(false);
        }
    }

    private onDisband() {
        Client.Instance.showPromptDialog("房间已解散，请返回大厅。", () => { this.exitRoom(); }, () => { this.exitRoom(); });
    }
}
