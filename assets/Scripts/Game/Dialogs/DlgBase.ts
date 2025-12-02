import { Component, Node } from 'cc';

export class DlgBase extends Component {
    protected onLoad(): void {
        this.node.on(Node.EventType.ACTIVE_CHANGED, this.onActiveChanged, this);
    }

    protected start(): void {
        this.onActiveChanged();
    }

    protected onActiveChanged(): void {}

    public onCloseClicked() {
        this.beforeClose();
        this.node.active = false;
    }

    protected beforeClose(): void {}
}
