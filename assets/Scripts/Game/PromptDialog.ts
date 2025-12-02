// 提示对话框
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.24

import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PromptDialog')
export class PromptDialog extends Component {
    @property({ type: Label })
    private labelMessage: Label = null;

    // 点击确定回调函数
    private okFunc: Function | null = null;

    // 点击取消回调函数
    private cancelFunc : Function | null = null;

    public showMessage(text: string, okFunc: Function | null, cancelFunc: Function | null) {
        this.labelMessage.string = text;
        this.okFunc = okFunc;
        this.cancelFunc = cancelFunc;
    }

    public onOkClicked() {
        this.node.destroy();
        if (this.okFunc) {
            this.okFunc();
        }
    }

    public onCancelClicked() {
        this.node.destroy();
        if (this.cancelFunc) {
            this.cancelFunc();
        }
    }
}


