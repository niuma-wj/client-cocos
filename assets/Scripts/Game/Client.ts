// 客户端主逻辑
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.22

import { _decorator, Component, Node, Prefab, instantiate, AudioSource, AudioClip } from 'cc';
import { GameManager } from '../Manager/GameManager';
import { NetMsgManager } from '../Manager/NetMsgManager';
import { VoiceManager } from '../Manager/VoiceManager';
import { ResourceLoader } from '../Manager/ResourceLoader';
import { PromptDialog } from './PromptDialog';
import { PromptTip } from './PromptTip';
import { Login } from './Login';
import { GameLoader } from './GameLoader';
import { NetworkManager } from '../Manager/NetworkManager';
import { Hall } from './Hall';
const { ccclass, property } = _decorator;

@ccclass('Client')
export class Client extends Component {
    @property({ type: Node })
    private loginLayer: Node = null;

    @property({ type: Node })
    private hallLayer: Node = null;

    @property({ type: Node })
    private gameLoader: Node = null;

    @property({ type: Node })
    private gameHall: Node = null;

    @property({ type: Node })
    private gameRoom: Node = null;

    @property({ type: Node })
    private promptLayer: Node = null;

    @property({ type: Node })
    private connect: Node = null;

    @property({ type: AudioSource })
    private bgmSource: AudioSource = null;

    // 自定义的提示对话框预制体
    private promptDialogPrefab: Prefab = null;

    // 自定义的提示文本预制体
    private promptTipPrefab: Prefab = null;

    private login: Node = null;

    private hall: Node = null;

    private gameHallNode: Node = null;

    private gameRoomNode: Node = null;

    private static _instance: Client = null;

    public static get Instance(): Client {
        return Client._instance;
    }

    protected onLoad(): void {
        if (Client._instance === null) {
            Client._instance = this;
        } else {
            console.log("Client is already existed!");
            this.destroy();
        }
    }

    start() {
        console.log("Client start.");
        GameManager.Instance.loadSetting();
        NetMsgManager.Instance.init();
        VoiceManager.Instance.start();
        this.setMusicVolume();
    }

    update(deltaTime: number) {
        NetMsgManager.Instance.handleMessages();
        NetworkManager.Instance.update(deltaTime);
        GameManager.Instance.heartbeat();
    }
    
    public onLoadComplete() {
        ResourceLoader.Instance.loadAsset("Login", "Login", Prefab, (prefab: Prefab) => {
            if (!prefab) return;
            this.login = instantiate(prefab);
            this.login.parent = this.loginLayer;
        });
    }

    public onLoginSucceed() {
        if (this.hall) {
            this.hall.active = true;
            return;
        }
        ResourceLoader.Instance.loadAsset("Hall", "Hall", Prefab, (hall: Prefab) => {
            if (!hall) return;
            this.hall = instantiate(hall);
            this.hall.parent = this.hallLayer;
        });
    }

    public setPromptDialogPrefab(prefab: Prefab) {
        this.promptDialogPrefab = prefab;
    }

    public setPromptTipPrefab(prefab: Prefab) {
        this.promptTipPrefab = prefab;
    }

    public showPromptDialog(text: string, okFunc: (() => void) | null = null, cancelFunc: (() => void) | null = null) {
        if (this.promptDialogPrefab) {
            let dlgNode = instantiate(this.promptDialogPrefab);
            dlgNode.parent = this.promptLayer;
            let dlg = dlgNode.getComponent(PromptDialog);
            dlg.showMessage(text, okFunc, cancelFunc);
            return;
        }
        ResourceLoader.Instance.loadAsset("Prompt", "PromptDialog", Prefab, (prompt: Prefab) => {
            if (!prompt) return;
            let dlgNode = instantiate(prompt);
            dlgNode.parent = this.promptLayer;
            let dlg = dlgNode.getComponent(PromptDialog);
            dlg.showMessage(text, okFunc, cancelFunc);
        });
    }

    public showPromptTip(text: string, life: number = 2) {
        if (this.promptTipPrefab) {
            console.log("showPromptTip1");
            let tipNode = instantiate(this.promptTipPrefab);
            tipNode.parent = this.promptLayer;
            let tip = tipNode.getComponent(PromptTip);
            tip.showTip(text, life);
            return;
        }
        ResourceLoader.Instance.loadAsset("Prompt", "PromptTip", Prefab, (prefab: Prefab) => {
            if (!prefab) return;
            let tipNode = instantiate(prefab);
            tipNode.parent = this.promptLayer;
            let tip = tipNode.getComponent(PromptTip);
            tip.showTip(text, life);
        });
    }

    public setMusicVolume() {
        if (!this.bgmSource) return;
        if (GameManager.Instance.MusicMute) {
            this.bgmSource.volume = 0;
        }
        else {
            this.bgmSource.volume = GameManager.Instance.MusicVolume;
        }
    }

    public playBackgroundMusic(clip: AudioClip) {
        if (!this.bgmSource) return;
        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.play();
    }

    public logout() {
        if (this.gameRoomNode) {
            this.gameRoomNode.destroy();
            this.gameRoomNode = null;
        }
        if (this.gameHallNode) {
            this.gameHallNode.destroy();
            this.gameHallNode = null;
        }
        if (this.hall) {
            this.hall.destroy();
            this.hall = null;
        }
        if (this.login) {
            let comp: Login = this.login.getComponent(Login);
            if (comp) {
                comp.onCodeClicked1();
                comp.playBackgroundMusic();
            }
        }
    }

    public loadGame(name: string) {
        if (!this.gameLoader) return;
        ResourceLoader.Instance.loadAsset("GameLoader", "GameLoader", Prefab, (prefab: Prefab) => {
            if (!prefab) return;
            let tmpNode = instantiate(prefab);
            tmpNode.parent = this.gameLoader;
            let comp = tmpNode.getComponent(GameLoader);
            if (comp) {
                comp.loadGame(name);
            }
        });
    }

    public initGameHall(prefab: Prefab) {
        this.gameHallNode = instantiate(prefab);
        this.gameHallNode.parent = this.gameHall;
    }

    public initGameRoom(prefab: Prefab) {
        this.gameRoomNode = instantiate(prefab);
        this.gameRoomNode.parent = this.gameRoom;
    }

    public backToHall() {
        if (this.gameRoomNode) {
            this.gameRoomNode.destroy();
            this.gameRoomNode = null;
        }
        if (this.gameHallNode) {
            this.gameHallNode.destroy();
            this.gameHallNode = null;
        }
        this.promptDialogPrefab = null;
        this.promptTipPrefab = null;
        if (this.hall) {
            let comp: Hall = this.hall.getComponent(Hall);
            if (comp) {
                comp.playBackgroundMusic();
            }
        }
    }

    public backToGameHall() {
        if (this.gameRoomNode) {
            this.gameRoomNode.destroy();
            this.gameRoomNode = null;
        }
        this.promptDialogPrefab = null;
        this.promptTipPrefab = null;
        if (this.hall) {
            let comp: Hall = this.hall.getComponent(Hall);
            if (comp) {
                comp.playBackgroundMusic();
            }
        }
    }

    public showConnecting(show: boolean) {
        this.connect.active = show;
    }
}

