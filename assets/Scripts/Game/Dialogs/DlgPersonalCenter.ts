import { _decorator, Component, Label, Node, Sprite, SpriteFrame, sys } from 'cc';
import { Client } from '../Client';
import { GameManager } from '../../Manager/GameManager';
import { DlgBase } from './DlgBase';
const { ccclass, property } = _decorator;

@ccclass('DlgPersonalCenter')
export class DlgPersonalCenter extends DlgBase {
    @property({ type: Sprite })
    private spriteHead: Sprite = null;

    @property({ type: Label })
    private labelNickname: Label = null;

    @property({ type: Label })
    private labelPlayerId: Label = null;

    @property({ type: Label })
    private labelAgencyId: Label = null;

    @property({ type: Label })
    private labelAgencyName: Label = null;

    @property({ type: Label })
    private labelLoginDate: Label = null;

    @property({ type: Label })
    private labelLoginIp: Label = null;

    @property({ type: Label })
    private labelGold: Label = null;

    @property({ type: Label })
    private labelDiamond: Label = null;

    private playerInfoTime: number = 0;

    start() {
        super.start();
    }

    update(deltaTime: number) {
        if (GameManager.Instance.PlayerInfoTime > this.playerInfoTime) {
            this.updatePlayerInfo();
        }
    }

    private updatePlayerInfo() {
        this.playerInfoTime = sys.now();
        this.labelNickname.string = GameManager.Instance.NickName;
        this.labelPlayerId.string = GameManager.Instance.PlayerId;
        this.labelGold.string = GameManager.Instance.Gold.toString();
        this.labelDiamond.string = GameManager.Instance.Diamond.toString();
        if (!GameManager.Instance.Avatar) return;
        GameManager.Instance.loadSpriteFrame(GameManager.Instance.Avatar, (spriteFrame: SpriteFrame) => {
            this.spriteHead.spriteFrame = spriteFrame;
        });
        GameManager.Instance.authGet("/player/personal/data").then((dto) => {
            this.labelLoginDate.string = dto.loginDate;
            this.labelLoginIp.string = dto.loginIp;
            if (dto.agencyId) {
                this.labelAgencyId.string = dto.agencyId;
            }
            else {
                this.labelAgencyId.string = null;
            }
            if (dto.agencyName) {
                this.labelAgencyName.string = dto.agencyName;
            }
            else {
                this.labelAgencyName.string = null;
            }
        });
    }

    public onBindClicked(): void {
        Client.Instance.showPromptTip("未实现", 2.0);
    }

    public onLogoutClicked(): void {
        GameManager.Instance.logout();
        Client.Instance.logout();
    }

    public onCopyMyIdClicked() {
        Client.Instance.showPromptTip("未支持", 2.0);
    }

    public onCopyAgencyIdClicked() {
        Client.Instance.showPromptTip("未支持", 2.0);
    }
}

