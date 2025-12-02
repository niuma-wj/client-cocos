import { _decorator, Component, EditBox, Node, Toggle } from 'cc';
import { GameManager } from '../../Manager/GameManager';
import { NetworkManager } from '../../Manager/NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('DlgChat')
export class DlgChat extends Component {
    @property({ type: Toggle })
    private memeCheck: Toggle = null;

    @property({ type: Toggle })
    private phraseCheck: Toggle = null;

    @property({ type: Toggle })
    private emojiCheck: Toggle = null;

    @property({ type: Node })
    private memeList: Node = null;

    @property({ type: Node })
    private phraseList: Node = null;

    @property({ type: Node })
    private emojiList: Node = null;

    @property({ type: EditBox })
    private inputField: EditBox = null;

    private chatPage: number = 1;

    start() {}

    update(deltaTime: number) { }
    
    public show(s: boolean) {
        this.node.active = s;
    }

    public onMemeClick(event: Event, customEventData: any | null) {
        let idx: number = Number(customEventData);
        if (isNaN(idx)) return;
        this.sendChatMessage(4, idx, "");
        this.show(false);
    }

    public onEmojiClick(event: Event, customEventData: any | null) {
        let idx: number = Number(customEventData);
        if (isNaN(idx)) return;
        this.sendChatMessage(1, idx, "");
        this.show(false);
    }

    public onPhraseClick(event: Event, customEventData: any | null) {
        let idx: number = Number(customEventData);
        if (isNaN(idx)) return;
        this.sendChatMessage(2, idx, "");
        this.show(false);
    }

    private sendChatMessage(type: number, idx: number, text: string) {
        let msg = {
            venueId: GameManager.Instance.VenueId,
            type: type,
            index: idx,
            text: text
        };
        NetworkManager.Instance.sendMessage("MsgChatClient", msg, true);
    }

    public onCloseClick() {
        this.show(false);
    }

    public onSendClick() {
        if (!this.inputField) return;
        let text: string = this.inputField.string;
        if (!text) return;
        this.inputField.string = "";
        this.sendChatMessage(3, 0, text);
        this.show(false);
    }

    public onMemeCheck(event: Event, customEventData: any | null) {
        if (!this.memeCheck.isChecked) return;
        this.chatPage = 1;
        this.onChatPageChanged();
    }

    public onPhraseCheck(event: Event, customEventData: any | null) {
        if (!this.phraseCheck.isChecked) return;
        this.chatPage = 2;
        this.onChatPageChanged();
    }

    public onEmojiCheck(event: Event, customEventData: any | null) {
        if (!this.emojiCheck.isChecked) return;
        this.chatPage = 3;
        this.onChatPageChanged();
    }

    private onChatPageChanged() {
        if (this.memeList) this.memeList.active = (this.chatPage === 1);
        if (this.phraseList) this.phraseList.active = (this.chatPage === 2);
        if (this.emojiList) this.emojiList.active = (this.chatPage === 3);
    }
}
