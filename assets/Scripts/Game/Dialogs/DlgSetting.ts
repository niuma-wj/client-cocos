import { _decorator, Component, Node, Slider, Toggle, Event, EventHandler } from 'cc';
import { DlgBase } from './DlgBase';
import { Client } from '../Client';
import { GameManager } from '../../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('DlgSetting')
export class DlgSetting extends DlgBase {
    @property({ type: Slider })
    private sliderMusic: Slider = null;

    @property({ type: Slider })
    private sliderSound: Slider = null;

    @property({ type: Toggle })
    private muteMusic: Toggle = null;

    @property({ type: Toggle })
    private muteSound: Toggle = null;

    private modified: boolean = false;

    @property({ type: [EventHandler] })
    private soundVolumeChangedEvents: EventHandler[] = [];

    start() {
        super.start();
    }

    update(deltaTime: number) {}

    protected onActiveChanged(): void {
        this.sliderMusic.progress = GameManager.Instance.MusicVolume;
        this.sliderSound.progress = GameManager.Instance.SoundVolume;
        this.muteMusic.isChecked = GameManager.Instance.MusicMute;
        this.muteSound.isChecked = GameManager.Instance.SoundMute;
        this.modified = false;
    }

    public onSliderChangedMusic(slider: Slider, customEventData: any | null) {
        GameManager.Instance.MusicVolume = slider.progress;
        Client.Instance.setMusicVolume();
        this.modified = true;
    }

    public onSliderChangedSound(slider: Slider, customEventData: any | null) {
        GameManager.Instance.SoundVolume = slider.progress;
        for (let i: number = 0; i < this.soundVolumeChangedEvents.length; i++) {
            let handler: EventHandler = this.soundVolumeChangedEvents[i];
            if (handler) {
                handler.emit([null, handler.customEventData]);
            }
        }
        this.modified = true;
    }

    public onMusicToggle(event: Event, customEventData: any | null) {
        //console.log("Music mute: ", this.muteMusic.isChecked);
        GameManager.Instance.MusicMute = this.muteMusic.isChecked;
        Client.Instance.setMusicVolume();
        this.modified = true;
    }

    public onSoundToggle(event: Event, customEventData: any | null) {
        //console.log("Sound mute: ", this.muteSound.isChecked);
        GameManager.Instance.SoundMute = this.muteSound.isChecked;
        for (let i: number = 0; i < this.soundVolumeChangedEvents.length; i++) {
            let handler: EventHandler = this.soundVolumeChangedEvents[i];
            if (handler) {
                handler.emit([event, handler.customEventData]);
            }
        }
        this.modified = true;
    }

    protected beforeClose(): void  {
        if (!this.modified) return;
        this.modified = false;
        GameManager.Instance.saveSetting();
    }
}


