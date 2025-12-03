import { _decorator, Component, Node, AudioClip, AudioSource } from 'cc';
import { ResourceLoader } from '../../Manager/ResourceLoader';
import { GameManager } from '../../Manager/GameManager';
import { Client } from '../Client';
import { PokerPoint, PokerSuit } from '../../Common/ConstDefines';
const { ccclass, property } = _decorator;

@ccclass('AudioControl')
export class AudioControl extends Component {
    // 各位玩家的游戏音效
    @property({ type: [AudioSource] })
    private gameSources: AudioSource[] = [];

    // 各位玩家的常用语音效
    @property({ type: [AudioSource] })
    private phraseSources: AudioSource[] = [];

    // 共用音效
    @property({ type: AudioSource })
    private shareSource: AudioSource = null;

    // 共用循环音效
    @property({ type: AudioSource })
    private loopSource: AudioSource = null;

    // 是否正在播放发牌声音
    private dealing: boolean = false;

    // 等待播放发牌声音已过了多久，单位秒
    private dealElapsed: number = 0.0;

    // 是否正在播放循环音效
    private looping: boolean = false;

    // 播放循环音效剩余多少时间，单位秒
    private loopTime: number = 0.0;

    start() {
        this.onSoundVolumeChanged(null, null);
        ResourceLoader.Instance.loadAsset("GuanDanAudio", "bg", AudioClip, (clip: AudioClip) => {
            Client.Instance.playBackgroundMusic(clip);
        });
    }

    update(deltaTime: number) {
        if (this.dealing) {
            this.dealElapsed = this.dealElapsed + deltaTime;
            if (this.dealElapsed > 0.5) {
                this.dealing = false;
                this.playDeal();
            }
        }
        if (this.looping) {
            this.loopTime = this.loopTime - deltaTime;
            if (this.loopTime <= 0.0) {
                this.looping = false;
                if (this.loopSource) {
                    this.loopSource.stop();
                }
            }
        }
    }

    // 播放开始新一局声音
    public playStart() {
        if (GameManager.Instance.SoundMute) return;
        ResourceLoader.Instance.loadAsset("GuanDanAudio", "gamestart", AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.shareSource.stop();
                this.shareSource.clip = clip;
                this.shareSource.play();
            }
        });
        this.dealing = true;
        this.dealElapsed = 0.0;
    }

    // 播放发牌声音
    private playDeal() {
        ResourceLoader.Instance.loadAsset("GuanDanAudio", "dealcard", AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.loopSource.stop();
                this.loopSource.clip = clip;
                this.loopSource.play();
                this.looping = true;
                this.loopTime = 1;
            }
        });
    }

    // 播放出牌声音
    public playGenre(male: boolean, clientSeat: number, genre: number, card: any, firstPlay: boolean) {
        if (GameManager.Instance.SoundMute) return;
        if (!this.gameSources[clientSeat]) return;
        let yaPai: boolean = false;
        if (!firstPlay && genre < 8) {
            let rand: number = Math.random();
            if (rand < 0.12) yaPai = true;
        }
        let clipName: string = null;
        if (yaPai) {
            clipName = "yapai";
        }
        else {
            if (genre == 1 || genre == 3) {
                // 单张或对子
                let point: number = card.point;
                let suit: number = card.suit;
                if (PokerPoint.Joker === point) {
                    if (genre === 3) clipName = "duizi";
                    else if (PokerSuit.Little === suit) clipName = "1_15";
                    else clipName = "1_16";
                }
                else {
                    let part1: string = null;
                    let part2: string = null;
                    if (genre === 1) part1 = "1_";
                    else part1 = "2_";
                    if (PokerPoint.Ace === point) part2 = "14";
                    else part2 = point.toString();
                    clipName = part1 + part2;
                }
            }
            else if (genre === 2) {
                // 顺子
                clipName = "shunzi";
            }
            else if (genre === 4) {
                // 3连对(木板)
                clipName = "sanliandui";
            }
            else if (genre === 5) {
                // 3张
                clipName = "sanzhang";
            }
            else if (genre === 6) {
                // 三顺2(钢板)
                clipName = "feiji";
            }
            else if (genre === 7) {
                // 3带2
                clipName = "sandaier";
            }
            else if (genre > 7 && genre < 10) {
                // 4炸、5炸
                clipName = "zhadan";
            }
            else if (genre == 10) {
                // 同花顺
                clipName = "tonghuashun";
            }
            else if (genre > 10 && genre < 16) {
                // 6炸~10炸
                clipName = "zhadan";
            }
            else if (genre == 16) {
                // 王炸
                clipName = "wangzha";
            }
            else return;
        }
        let path: string = male ? "ChuPai/Male/" : "ChuPai/Female/";
        clipName = path + clipName;
        ResourceLoader.Instance.loadAsset("GuanDanAudio", clipName, AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.gameSources[clientSeat].stop();
                this.gameSources[clientSeat].clip = clip;
                this.gameSources[clientSeat].play();
            }
        });
    }

    // 播放"不要"声音
    public playPass(male: boolean, clientSeat: number) {
        if (GameManager.Instance.SoundMute) return;
        if (!this.gameSources[clientSeat]) return;
        let clipName: string = null;
        let rand: number = Math.random();
        if (rand < 0.34) clipName = "pass1";
        else if (rand < 0.67) clipName = "pass2";
        else clipName = "pass3";
        let path: string = male ? "ChuPai/Male/" : "ChuPai/Female/";
        clipName = path + clipName;
        ResourceLoader.Instance.loadAsset("GuanDanAudio", clipName, AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.gameSources[clientSeat].stop();
                this.gameSources[clientSeat].clip = clip;
                this.gameSources[clientSeat].play();
            }
        });
    }

    // 播放告警声音
    public playAlert() {
        if (GameManager.Instance.SoundMute) return;
        if (!this.shareSource) return;
        ResourceLoader.Instance.loadAsset("GuanDanAudio", "warning", AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.shareSource.stop();
                this.shareSource.clip = clip;
                this.shareSource.play();
            }
        });
    }

    // 播放倒计时声音
    public playCountdown(cnt: number) {
        if (GameManager.Instance.SoundMute) return;
        if (!this.gameSources[0]) return;
        if (cnt < 0 || cnt > 5) return;
        let clipName: string = "Clock/warning" + cnt.toString();
        ResourceLoader.Instance.loadAsset("GuanDanAudio", clipName, AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.gameSources[0].stop();
                this.gameSources[0].clip = clip;
                this.gameSources[0].play();
            }
        });
    }

    // 播放输赢结局声音
    public playResult(winOrLose: number) {
        if (GameManager.Instance.SoundMute) return;
        if (!this.shareSource) return;
        let clipName: string = (winOrLose === 1) ? "Game/win" : "Game/lose";
        ResourceLoader.Instance.loadAsset("GuanDanAudio", clipName, AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.shareSource.stop();
                this.shareSource.clip = clip;
                this.shareSource.play();
            }
        });
    }

    // 播放常用语声音
    public playPhrase(male: boolean, clientSeat: number, phrase: number) {
        if (GameManager.Instance.SoundMute) return;
        if (phrase < 0 || phrase > 8) return;
        if (!this.phraseSources[clientSeat]) return;
        phrase = phrase + 1;
        let clipName: string = null;
        if (phrase < 10) clipName = male ? "Phrase/Male/phrase0" : "Phrase/Female/phrase0";
        else clipName = male ? "Phrase/Male/phrase" : "Phrase/Female/phrase";
        clipName = clipName + phrase.toString();
        ResourceLoader.Instance.loadAsset("GuanDanAudio", clipName, AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.phraseSources[clientSeat].stop();
                this.phraseSources[clientSeat].clip = clip;
                this.phraseSources[clientSeat].play();
            }
        });
    }

    public playProp(clientSeat: number, prop: number) {
        if (GameManager.Instance.SoundMute) return;
        if (!this.gameSources[clientSeat]) return;
        if (prop < 0 || prop > 4) return;
        prop = prop + 1;
        let clipName: string = "Prop/pro_%d" + prop.toString();
        ResourceLoader.Instance.loadAsset("GuanDanAudio", clipName, AudioClip, (clip: AudioClip) => {
            if (clip) {
                this.gameSources[clientSeat].stop();
                this.gameSources[clientSeat].clip = clip;
                this.gameSources[clientSeat].play();
            }
        });
    }

    public onSoundVolumeChanged(event: Event, customEventData: any | null) {
        let volume: number = GameManager.Instance.SoundVolume;
        if (GameManager.Instance.SoundMute)
            volume = 0;
        for (let i: number = 0; i < this.gameSources.length; i++) {
            let src: AudioSource = this.gameSources[i];
            if (src) src.volume = volume;
        }
        for (let i: number = 0; i < this.phraseSources.length; i++) {
            let src: AudioSource = this.phraseSources[i];
            if (src) src.volume = volume;
        }
        if (this.shareSource) this.shareSource.volume = volume;
        if (this.loopSource) this.loopSource.volume = volume;
    }
}
