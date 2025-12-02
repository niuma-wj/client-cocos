// 资源加载界面
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.22

import { _decorator, Component, Label, Node, Prefab, Sprite, ProgressBar, sys, assetManager, AudioClip } from 'cc';
import { GameManager } from '../Manager/GameManager';
import { ResourceLoader } from '../Manager/ResourceLoader';
import { Client } from './Client';
const { ccclass, property } = _decorator;

@ccclass('Load')
export class Load extends Component {
    @property({ type: Label })
    private progress: Label = null;

    @property({ type: ProgressBar })
    private progressBar: ProgressBar = null;

    start() {
        console.log("Load start.");
        this.loadConfig();
    }

    update(deltaTime: number) { }
    
    private loadConfig() {
        let url: string = "https://gzyx.oss-cn-shenzhen.aliyuncs.com/config.json";
        //let url: string = "http://192.168.6.220:8088/niuma/config.json";
        fetch(url).then((response: Response) => {
            return response.json();
        }).then((value) => {
            this.onLoadConfig(value);
        }).catch((err) => {
            if (this.progress) {
                this.progress.string = err;
            }
        });
    }

    private onLoadConfig(data) {
        GameManager.Instance.HttpHost = data.httpHost;
        console.log("Http host: ", data.httpHost);
        this.loadResources();
    }

    private loadResources() {
        let assets: any = [
            { bundleName: "Login", assetList: [{ assetType: Prefab, paths: ["Login"] }, { assetType: AudioClip, paths: ["bg_login"] }] },
            { bundleName: "Prompt", assetList: [{ assetType: Prefab, paths: ["PromptDialog", "PromptTip"] }] },
            { bundleName: "Hall", assetList: [{ assetType: Prefab, paths: ["Hall"] }, { assetType: AudioClip, paths: ["bg_hall"] }] },
            { bundleName: "GameList", assetList: [{ assetType: Prefab, paths: ["GameList"] }] },
            { bundleName: "GameLoader", assetList: [{ assetType: Prefab, paths: ["GameLoader"] }] },
            { bundleName: "Bank", assetList: [{ assetType: Prefab, paths: ["DlgBank"] }] },
            { bundleName: "Dialog", assetList: [{ assetType: Prefab, paths: ["DlgEmail", "DlgService"] }] },
            { bundleName: "PersonalCenter", assetList: [{ assetType: Prefab, paths: ["DlgPersonalCenter"] }] },
            { bundleName: "Setting", assetList: [{ assetType: Prefab, paths: ["DlgSetting"] }] },
            { bundleName: "Shop", assetList: [{ assetType: Prefab, paths: ["DlgShop"] }] },
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
            this.onLoadComplete();
        });
    }

    private onLoadComplete() {
        Client.Instance.onLoadComplete();
    }
}