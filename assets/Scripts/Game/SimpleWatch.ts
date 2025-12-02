import { _decorator, Component, Node, Label } from 'cc';
import { CommonUtils } from '../Utils/CommonUtils';
const { ccclass, property } = _decorator;

@ccclass('SimpleWatch')
export class SimpleWatch extends Component {
    @property({ type: Label })
    private labelTime: Label = null;

    private showColon: boolean = false;

    private elapsed: number = 1.0;

    start() {}

    update(deltaTime: number) {
        if (!this.labelTime) return;
        this.elapsed += deltaTime;
        if (this.elapsed > 1.0) {
            this.showColon = !this.showColon;
            while (this.elapsed > 1.0) {
                this.elapsed -= 1.0;
            }
            let currentTime: Date = new Date();
            let hours: number = currentTime.getHours();
            let minutes: number = currentTime.getMinutes();
            let part1: string = CommonUtils.formatInteger(hours, 2);
            let part2: string = CommonUtils.formatInteger(minutes, 2);
            if (this.showColon) this.labelTime.string = part1 + ":" + part2;
            else this.labelTime.string = part1 + " " + part2;
        }
    }
}


