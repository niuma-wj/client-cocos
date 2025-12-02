import { _decorator, Button, Component, Node } from 'cc';
import { DlgBase } from './DlgBase';
import { Client } from '../Client';
import { GameManager } from '../../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('DlgShop')
export class DlgShop extends DlgBase {
    start() {
        super.start();
    }

    update(deltaTime: number) {}

    public onBuyClicked(button: Button, customEventData: any) {
        let index: number = Number(customEventData);
        if (isNaN(index) || index < 1 || index > 6) return;
        let diamonds = [ 50, 100, 200, 300, 400, 500 ];
        let golds = [ 1250, 2400, 4600, 6600, 8400, 10000 ];
        let text = "确定购买" + diamonds[index - 1].toString() + "枚钻石吗？将花费" + golds[index - 1].toString() + "金币。";
        Client.Instance.showPromptDialog(text, () => {
            let path = "/player/capital/diamond/buy/" + index.toString();
            GameManager.Instance.authGet(path).then((dto) => {
                if (dto.code !== "00000000") {
                    Client.Instance.showPromptTip("购买钻石失败: " + dto.msg, 3.0);
                    return;
                }
                GameManager.Instance.Gold = dto.gold;
                GameManager.Instance.Diamond = dto.diamond;
                GameManager.Instance.updatePlayerInfoTime();
                Client.Instance.showPromptTip("购买钻石成功");
            }).catch((err) => {
                console.log("Buy diamond error: ", err);
            });
        });
    }
}
