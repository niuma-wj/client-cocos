import { _decorator, Component, Label, math, Node } from 'cc';
import { GameManager } from '../../Manager/GameManager';
import { NetworkManager } from '../../Manager/NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('DlgDisband')
export class DlgDisband extends Component {
    @property({ type: Label })
    private description: Label = null;

    @property({ type: [Label] })
    private names: Label[] = [];

    @property({ type: [Label] })
    private choices: Label[] = [];

    @property({ type: Label })
    private textCountdown: Label = null;

    @property({ type: Node })
    private btnAgree: Node = null;
    
    @property({ type: Node })
    private btnAgree1: Node = null;

    @property({ type: Node })
    private btnRefuse: Node = null;

    @property({ type: Node })
    private btnRefuse1: Node = null;

    // 倒计时
    private countdown: number = 0.0;

    private countingdown: boolean = false;

    //
    private disbander: number = 0;

    start() {}

    update(deltaTime: number) {
        if (!this.countingdown) return;
        this.countdown = this.countdown - deltaTime;
        if (this.countdown > 0) {
            let sec: number = Math.floor(this.countdown + 0.5);
            if (this.textCountdown) {
                this.textCountdown.string = sec.toString()
            }
        }
        else {
            this.countingdown = false;
        }
    }

    public show(s: boolean) {
        this.node.active = s;
    }

    public isVisible() {
        return this.node.active;
    }

    public onAgreeClick() {
        this.sendDisbandChoose(1);
    }

    public onRefuseClick() {
        this.sendDisbandChoose(2);
    }

    private sendDisbandChoose(choice: number) {
        let msg = {
            venueId: GameManager.Instance.VenueId,
            choice: choice
        };
        NetworkManager.Instance.sendMessage("MsgDisbandChoose", msg, true);
    }

    // mySeat为本机玩家在服务器的座位号
    public onDisbandVote(msg: any, names: string[], mySeat: number) {
        let disbander: number = msg.disbander;
        let elapsed: number = msg.elapsed;
        let choices: number[] = msg.choices;
        let text = null;
        if (this.description) {
            if (disbander === mySeat) {
                text = "您请求解散房间，正在等待其他玩家投票解散，超半数玩家同意即可解散。5分钟不操作，默认同意。"
            }
            else {
                text = "玩家【" + names[disbander] + "】请求解散房间，正在等待其他玩家投票解散，超半数玩家同意即可解散。5分钟不操作，默认同意。"
            }
            this.description.string = text;
        }
        let nums: number = 0;
        for (let i: number = 0; i < 4; i++) {
            if (i !== disbander) {
                if (this.names[nums]) {
                    this.names[nums].string = names[i];
                }
                if (this.choices[nums]) {
                    if (choices[i] === 1) {
                        this.choices[nums].string = "同意";
                        this.choices[nums].color = new math.Color(0, 128, 0, 255);
                    }
                    else if (choices[i] === 2) {
                        this.choices[nums].string = "拒绝";
                        this.choices[nums].color = new math.Color(128, 0, 0, 255);
                    }
                    else {
                        this.choices[nums].string = "等待选择";
                        this.choices[nums].color = new math.Color(128, 128, 128, 255);
                    }
                }
                nums = nums + 1;
            }
        }
        this.disbander = disbander;
        this.countdown = 300 - (elapsed / 1000);
        this.countingdown = true;
        if (this.btnAgree) {
            this.btnAgree.active = (choices[mySeat] === 0);
        }
        if (this.btnAgree1) {
            this.btnAgree1.active = (choices[mySeat] !== 0);
        }
        if (this.btnRefuse) {
            this.btnRefuse.active = (choices[mySeat] === 0);
        }
        if (this.btnRefuse1) {
            this.btnRefuse1.active = (choices[mySeat] !== 0);
        }
    }

    public onDisbandChoice(seat: number, mySeat: number, choice: number) {
        let tmp: number = seat;
        if (seat > this.disbander) {
            tmp = tmp - 1;
        }
        console.log("onDisbandChoice, ", tmp, ", ", mySeat, ", ", choice, ", ", this.disbander);
        if (this.choices[tmp]) {
            console.log("onDisbandChoice2");
            if (choice === 1) {
                this.choices[tmp].string = "同意";
                this.choices[tmp].color = new math.Color(0, 128, 0, 255);
            }
            else {
                this.choices[tmp].string = "拒绝";
                this.choices[tmp].color = new math.Color(128, 0, 0, 255);
            }
        }
        if (seat === mySeat) {
            if (this.btnAgree) this.btnAgree.active = false;
            if (this.btnAgree1) this.btnAgree1.active = true;
            if (this.btnRefuse) this.btnRefuse.active = false;
            if (this.btnRefuse1) this.btnRefuse1.active = true;
        }
    }
}
