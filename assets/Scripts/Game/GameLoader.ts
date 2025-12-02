import { _decorator, Component, Node, Label, Prefab, ProgressBar, Sprite, SpriteFrame, AudioClip } from 'cc';
import { Client } from './Client';
import { ResourceLoader } from '../Manager/ResourceLoader';
const { ccclass, property } = _decorator;

@ccclass('GameLoader')
export class GameLoader extends Component {
    @property({ type: Sprite })
    private bg: Sprite = null;

    @property({ type: ProgressBar })
    private progressBar: ProgressBar = null;

    @property({ type: Label })
    private progress: Label = null;

    start() {}

    update(deltaTime: number) { }
    
    public loadGame(name: string) {
        if (name === "GuanDan") {
            this.loadGuanDan();
            return;
        }
        else {
            Client.Instance.showPromptTip("游戏尚未开放");
        }
    }

    private loadGuanDan() {
        ResourceLoader.Instance.loadAsset("GameLoader", "guan_dan/spriteFrame", SpriteFrame, (sf: SpriteFrame) => {
            if (!sf) return;
            this.bg.spriteFrame = sf;
        });
        let assets: any = [
            { bundleName: "GuanDanCommon", assetList: [{ assetType: SpriteFrame, paths: ["bottom_bar/spriteFrame"] }] },
            { bundleName: "GuanDanHall", assetList: [{ assetType: Prefab, paths: ["Hall"] }] },
            { bundleName: "GuanDanAudio", assetList: [{ assetType: AudioClip, paths: ["bg"] }] },
            { bundleName: "GuanDanRoomBackground", assetList: [{ assetType: SpriteFrame, paths: ["bg/spriteFrame"] }] },
            { bundleName: "GuanDanRoomMain", assetList: [{ assetType: Prefab, paths: ["PlayerBoy", "PlayerGirl", "CardColumn", "CardPlayedOut", "CardSlot", "SignPass", "SignResist", "Room"] }] },
        ];
        ResourceLoader.Instance.loadAssets(assets, (current: number, total: number) => {
            let percent = current / total;
            if (this.progressBar) {
                this.progressBar.progress = percent;
            }
            percent *= 100;
            if (this.progress) {
                this.progress.string = "加载进度：" + percent.toFixed(2); + "%";
            }
        }, () => {
            this.onLoadGuanDanComplete();
        });
    }

    private onLoadGuanDanComplete() {
        ResourceLoader.Instance.loadAsset("GuanDanHall", "Hall", Prefab, (prefab: Prefab) => {
            if (!prefab) {
                Client.Instance.showPromptDialog("游戏加载失败", this.backToHall, this.backToHall);
                return;
            }
            Client.Instance.initGameHall(prefab);
            this.backToHall();
        });
    }

    private backToHall() {
        this.node.destroy();
    }
}