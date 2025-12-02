import { _decorator, Component, Node, Slider, Sprite, EventHandler } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SliderFill')
export class SliderFill extends Component {
    @property({ type: Slider })
    private slider: Slider = null;

    @property({ type: Sprite })
    private fill: Sprite = null;

    protected onLoad(): void {
        if (this.slider && this.fill) {
            const sliderEventHandler = new EventHandler();
            // 这个 node 节点是事件处理脚本组件所属的节点
            sliderEventHandler.target = this.node; 
            // 这个是脚本类名
            sliderEventHandler.component = 'SliderFill';
            sliderEventHandler.handler = 'onSliderEvent';
            this.slider.slideEvents.push(sliderEventHandler);
        }
    }

    start() {
        if (this.slider && this.fill) {
            this.fill.fillRange = this.slider.progress;
        }
    }

    update(deltaTime: number) {}

    onSliderEvent(slider: Slider, customEventData: string | null) {
        this.fill.fillRange = slider.progress;
    }
}


