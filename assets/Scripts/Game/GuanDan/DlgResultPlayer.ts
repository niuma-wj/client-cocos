import { _decorator, CCInteger, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DlgResultPlayer')
export class DlgResultPlayer extends Component {
    @property({ type: Sprite })
    public headTexture: Sprite = null;

    @property({ type: Label })
    public nickname: Label = null;

    @property({ type: Label })
    public textGold: Label = null;

    @property({ type: Node })
    public flagWin: Node = null;

    @property({ type: Node })
    public flagLose: Node = null;

    @property({ type: Node })
    public flagFriend: Node = null;

    @property({ type: Node })
    public flagEnemy: Node = null;

    @property({ type: Node })
    public btnKickOut: Node = null;

    @property({ type: Node })
    public flagKickOut: Node = null;

    public onKickOutClick(event: Event, customEventData: any | null) {

    }
}


