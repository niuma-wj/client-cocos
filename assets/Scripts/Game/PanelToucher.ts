import { _decorator, Component, EventHandler, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PanelToucher')
export class PanelToucher extends Component {
    @property({ type: [EventHandler] })
    private downEvents: EventHandler[] = [];

    @property({ type: [EventHandler] })
    private upEvents: EventHandler[] = [];

    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    update(deltaTime: number) {}
    
    private onTouchStart(event) {
        for (let i: number = 0; i < this.downEvents.length; i++) {
            let handler: EventHandler = this.downEvents[i];
            if (handler) {
                handler.emit([event, handler.customEventData]);
            }
        }
    }

    private onTouchEnd(event) {
        for (let i: number = 0; i < this.upEvents.length; i++) {
            let handler: EventHandler = this.upEvents[i];
            if (handler) {
                handler.emit([event, handler.customEventData]);
            }
        }
    }
}
