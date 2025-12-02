import { _decorator, Color, Component, Label, Node, Sprite, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PromptTip')
export class PromptTip extends Component {
    @property({ type: Sprite })
    private spriteBg: Sprite = null;

    @property({ type: Label })
    private labelMessage: Label = null;

    private fadingOut: boolean = false;

    private fadeTime: number = 0.0;

    update(deltaTime: number) {
        if (!this.fadingOut) return;
        const FadeDuration: number = 3.0;
        if (this.fadeTime > FadeDuration) {
            this.fadingOut = false;
            this.node.destroy();
        }
        this.fadeTime += deltaTime;
        let ratio = (FadeDuration - this.fadeTime) / FadeDuration;
        this.spriteBg.color = new Color(255, 255, 255, ratio * 255);
    }
    
    public showTip(text: string, life: number) {
        this.labelMessage.string = text;
        tween(this.node).to(0.2, { position: new Vec3(0.0, 200.0, 0.0) }, { easing: 'cubicOut' })
            .delay(life).call(() => {
                this.fadeOut();
            }).start();
    }

    private fadeOut() {
        // 注意！不能用tween(this.spriteBg.color).to(1, { a: 0 }, { easing: 'linear' })，这样会无法改变图片透明度
        tween(this.spriteBg).to(1, { color: new Color(255, 255, 255, 0) }, { easing: 'linear' })
            .call(() => {
                this.node.destroy();
            }).start();
        //this.fadingOut = true;
    }
}