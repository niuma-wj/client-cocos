// 一段录音
export class VoiceRecord {
    // 录音数据，mp3格式
    public data: Uint8Array = null;

    // 开始播放回调
    public onPlayStart: () => void | null = null;

    // 播放结束回调
    public onPlayEnd: () => void | null = null;
}

/**
 * 语音管理者
 * 使用Web Audio API播放语音
 */
export class VoiceManager {
    private static _instance: VoiceManager = null;
    
    public static get Instance(): VoiceManager {
        if (VoiceManager._instance == null) {
            VoiceManager._instance = new VoiceManager();
        }
        return VoiceManager._instance;
    } 

    private audioContext: AudioContext = null;

    private audioSource: AudioBufferSourceNode = null;

    private playing: boolean = false;

    private records: VoiceRecord[] = [];

    public start() {
        if (this.audioContext) return;
        this.audioContext = new AudioContext();
    }

    public addRecord(rec: VoiceRecord) {
        if (!rec) return;
        this.records.push(rec);
        this.playFront();
    }

    private playFront() {
        if (this.playing) return;
        if (this.records.length === 0) return;
        let rec: VoiceRecord = this.records.shift();
        this.playVoice(rec);
    }

    private playVoice(rec: VoiceRecord) {
        this.playing = true;
        this.audioContext.decodeAudioData(rec.data.buffer, (decodedData: AudioBuffer) => {
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = decodedData;
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.start(0); // 立即播放
            if (rec.onPlayStart) {
                rec.onPlayStart();
            }
            this.audioSource.onended = (event: Event) => {
                if (rec.onPlayEnd) {
                    rec.onPlayEnd();
                }
                this.onPlayEnd();
            };
        }, (error: DOMException) => {
            console.error(error);
            this.onPlayEnd();
        });
    }

    private onPlayEnd() {
        this.playing = false;
        this.playFront();
    }
}
