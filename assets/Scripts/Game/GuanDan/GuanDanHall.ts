import { _decorator, Component, Node, Label, Prefab } from 'cc';
import { Client } from '../Client';
import { GameType, DistrictId } from '../../Common/ConstDefines';
import { GameManager } from '../../Manager/GameManager';
import { CommonUtils } from '../../Utils/CommonUtils';
import { ResourceLoader } from '../../Manager/ResourceLoader';

const { ccclass, property } = _decorator;

@ccclass('GuanDanHall')
export class GuanDanHall extends Component {
    @property({ type: Node })
    private friendPopup: Node = null;

    @property({ type: Node })
    private chooseDlg: Node = null;

    @property({ type: Node })
    private joinRoomDlg: Node = null;

    @property({ type: [Label] })
    private labelNums: Label[] = [];

    private count: number = 0;

    private nums: number[] = [0, 0, 0, 0, 0, 0];

    start() {}

    update(deltaTime: number) {}

    public onDistrictClicked(event: Event, customEventData: any | null) {
        let name: string = String(customEventData);
        if (!name) return;
        if (name === "Friend") {
            this.onFriendClicked();
        }
        else if (name === "Practice") {
            this.createRoom(2);
        }
        else if (name === "Beginner") {
            this.enterDistrict(DistrictId.GuanDanBeginner);
        }
        else if (name === "Moderate") {
            this.enterDistrict(DistrictId.GuanDanModerate);
        }
        else if (name === "Advanced") {
            this.enterDistrict(DistrictId.GuanDanAdvanced);
        }
        else if (name === "Master") {
            this.enterDistrict(DistrictId.GuanDanMaster);
        }
    }

    public onBackClicked() {
        Client.Instance.backToHall();
    }

    private onFriendClicked() {
        if (this.friendPopup) {
            this.friendPopup.active = true;
        }
        if (this.chooseDlg) {
            this.chooseDlg.active = true;
        }
    }

    public onCreateRoomClicked() {
        if (this.friendPopup) {
            this.friendPopup.active = false;
        }
        if (this.chooseDlg) {
            this.chooseDlg.active = false;
        }
        this.createRoom(1);
    }

    public onJoinRoomClicked() {
        if (this.chooseDlg) {
            this.chooseDlg.active = false;
        }
        if (this.joinRoomDlg) {
            this.joinRoomDlg.active = true;
        }
    }

    private createRoom(level: number) {
        let data = {
            level: level
        };
        let text: string = JSON.stringify(data);
        text = CommonUtils.encodeBase64(text);
        console.log(text);
        let msg = {
            gameType: GameType.GuanDan,
            base64: text
        };
        GameManager.Instance.authPost("/player/game/create", msg).then((dto) => {
            if (dto.code !== "00000000") {
                Client.Instance.showPromptDialog("创建房间失败: " + dto.msg);
                return;
            }
            GameManager.Instance.enterVenue(dto.wsAddress, dto.venueId, GameType.GuanDan, () => { this.onEnterVenue(); });
        }).catch((err) => {
            console.log("Create room error: ", err);
        });
    }

    private enterDistrict(districtId: number) {
	    let url: string = "/player/game/enter/district?districtId=" + districtId.toString();
        GameManager.Instance.authPost(url, null).then((dto) => {
            if (dto.code !== "00000000") {
                Client.Instance.showPromptDialog("加入房间失败: " + dto.msg);
                return;
            }
            GameManager.Instance.enterVenue(dto.wsAddress, dto.venueId, GameType.GuanDan, () => { this.onEnterVenue(); });
        }).catch((err) => {
            console.log("Enter district error: ", err);
        });
    }

    private onEnterVenue() {
        ResourceLoader.Instance.loadAsset("GuanDanRoomMain", "Room", Prefab, (prefab: Prefab) => {
            if (!prefab) {
                Client.Instance.showPromptDialog("游戏加载失败");
                return;
            }
            Client.Instance.initGameRoom(prefab);
        });
    }

    public onCloseClicked1(event: Event, customEventData: any | null) {
        if (this.friendPopup) {
            this.friendPopup.active = false;
        }
    }

    public onCloseClicked2(event: Event, customEventData: any | null) {
        if (this.joinRoomDlg) {
            this.joinRoomDlg.active = false;
        }
        if (this.friendPopup) {
            this.friendPopup.active = false;
        }
    }

    public onNumClicked(event: Event, customEventData: any | null) {
        if (this.count > 5) return;
        let num: number = Number(customEventData);
        if (isNaN(num)) return;
        this.nums[this.count] = num;
        this.labelNums[this.count].string = num.toString();
        this.count += 1;
        if (this.count == 6) {
            let number: string = "";
            for (let i: number = 0; i < 6; i++) {
                number += this.nums[i].toString();
            }
            let gameType: number = GameType.GuanDan;
            let data = {
                number: number,
                gameType: gameType
            };
            GameManager.Instance.authPost("/player/game/enter/number", data).then((dto) => {
                if (!dto) {
                    Client.Instance.showPromptDialog("加入房间失败，服务器无响应");
                    return;
                }
                if (dto.code !== "00000000") {
                    Client.Instance.showPromptDialog("加入房间失败: " + dto.msg);
                    return;
                }
                GameManager.Instance.enterVenue(dto.wsAddress, dto.venueId, GameType.GuanDan, () => { this.onEnterVenue(); });
            }).catch((err) => {
                console.log("Enter room error: ", err);
            });
        }
    }

    public onReinputClicked(event: Event, customEventData: any | null) {
        for (let i: number = 0; i < 6; i++) {
            this.labelNums[i].string = "";
        }
        this.count = 0;
    }

    public onDeleteClicked(event: Event, customEventData: any | null) {
        if (this.count == 0) return;
        this.labelNums[this.count - 1].string = "";
        this.count -= 1;
    }
}
