import { _decorator, Component, Label, Node, math, UITransform, CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChatText')
export class ChatText extends Component {
    @property({ type: CCInteger })
    private marginWidth: number = 20;

    @property({ type: CCInteger })
    private marginHeight: number = 20;

    @property({ type: CCInteger })
    private minWidth: number = 0;

    @property({ type: CCInteger })
    private minHeight: number = 0;

    private label: Label = null;

    private updated: boolean = true;

    protected onLoad(): void {
        let labelNode = this.node.getChildByName("Label");
        if (labelNode) {
            this.label = labelNode.getComponent(Label);
        }
    }

    start() {}

    update(deltaTime: number) {
        if (!this.updated) return;
        if (!this.label) return;
        this.updated = false;
        let trans1: UITransform = this.label.node.getComponent(UITransform);
        if (!trans1) return;
        let trans2 = this.node.getComponent(UITransform);
        if (!trans2) return;
        let width = trans1.contentSize.width;
        let height = trans1.contentSize.height;
        if (width < this.minWidth) {
            width = this.minWidth;
        }
        if (height < this.minHeight) {
            height = this.minHeight;
        }
        width += this.marginWidth;
        height += this.marginHeight;
        trans2.contentSize = new math.Size(width, height);
    }

    public setChatText(text: string) {
        if (!this.label) return;
        this.label.string = text;
        this.updated = true;
    }

    public show(show: boolean) {
        this.node.active = show;
    }
}
