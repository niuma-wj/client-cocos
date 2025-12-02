import { _decorator, Component, Label, Node } from 'cc';
import { DlgResultPlayer } from './DlgResultPlayer';
import { GuanDanRoom } from './GuanDanRoom';
import { NetworkManager } from '../../Manager/NetworkManager';
import { GameManager } from '../../Manager/GameManager';
import { Client } from '../Client';

const { ccclass, property } = _decorator;

@ccclass('DlgResult')
export class DlgResult extends Component {
    @property({ type: [DlgResultPlayer] })
    private players: DlgResultPlayer[] = [];

    // 倒计时秒数
    @property({ type: Label })
    private second: Label = null;

    @property({ type: Node })
    private btnNextGroup: Node = null;

    @property({ type: Node })
    private titleWin: Node = null;

    @property({ type: Node })
    private titleLose: Node = null;

    @property({ type: Label })
    private gradePointText: Label = null;

    private room: GuanDanRoom = null;

    // 是否为房主
    private isOwner: boolean = false;

    // 倒计时
    private countDown = 0.0;
    
    start() { }

    update(deltaTime: number) {
        if (!this.second) return;
        if (this.countDown < 1.0) return;
        this.countDown = this.countDown - deltaTime;
        let text: string = null;
        if (this.countDown < 0.0) text = "0";
        else text = (Math.floor(this.countDown)).toString();
        this.second.string = text;
        if (this.countDown < 1.0) {
            this.onNextClick();
        }
    }

    public setRoom(room: GuanDanRoom) {
        this.room = room;
    }

    public show(s: boolean) {
        this.node.active = s;
    }

    public setOwner(flag: boolean) {
        this.isOwner = flag;
    }

    public setPlayer(idx: number, playerData: any, isSelf: boolean) {
        if (isSelf) {
            if (this.btnNextGroup) {
                this.btnNextGroup.active = !playerData.isKicked;
            }
        }
        let player: DlgResultPlayer = this.players[idx];
        if (!player) return;
        if (player.headTexture) player.headTexture.spriteFrame = playerData.headTexture;
        if (player.nickname) player.nickname.string = playerData.nickname;
        if (player.textGold) player.textGold.string = playerData.gold.toString();
        if (player.flagWin) player.flagWin.active = playerData.isWin;
        if (player.flagLose) player.flagLose.active = !playerData.isWin;
        if (player.flagFriend) player.flagFriend.active = playerData.isFriend;
        if (player.flagEnemy) player.flagEnemy.active = !playerData.isFriend;
        if (player.btnKickOut) {
            if (!(this.isOwner) || isSelf) {
                player.btnKickOut.active = false;
            }
            else {
                player.btnKickOut.active = !(playerData.isKicked);
            }
        }
        if (player.flagKickOut) player.flagKickOut.active = playerData.isKicked;
        if (isSelf) {
            if (this.titleWin) this.titleWin.active = playerData.isWin;
            if (this.titleLose) this.titleLose.active = !(playerData.isWin);
        }
    }

    public setPlayerKickOut(idx: number, isSelf: boolean) {
        if (isSelf) {
            if (this.btnNextGroup) this.btnNextGroup.active = false;
        }
        let player: DlgResultPlayer = this.players[idx];
        if (!player) return;
        if (player.btnKickOut) player.btnKickOut.active = false;
        if (player.flagKickOut) player.flagKickOut.active = true;
    }

    public setGradePoint(text: string) {
        if (this.gradePointText) {
            this.gradePointText.string = text;
        }
    }

    public startCountDown() {
        this.countDown = 10.99;
    }

    public onExitClick() {
        // 请求退出房间
        if (NetworkManager.Instance.isConnected()) {
            NetworkManager.Instance.sendInnerMessage("MsgLeaveVenue");
        }
        GameManager.Instance.leaveVenue();
        Client.Instance.backToGameHall();
    }

    public onNextClick() {
        this.show(false);
        if (this.room) this.room.showResult = false;
        // 请求同步掼蛋游戏数据
        NetworkManager.Instance.sendInnerMessage("MsgGuanDanSync");
        // 准备就绪
        NetworkManager.Instance.sendInnerMessage("MsgPlayerReady");
    }
}
