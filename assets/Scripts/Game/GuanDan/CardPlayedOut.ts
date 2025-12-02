import { _decorator, Component, Node, Prefab, SpriteFrame, instantiate, math, Sprite } from 'cc';
import { PokerPoint, PokerSuit } from '../../Common/ConstDefines';
const { ccclass, property } = _decorator;

@ccclass('CardPlayedOut')
export class CardPlayedOut extends Component {
    @property({ type: Prefab })
    private cardPlayedOut: Prefab = null;

    @property({ type: Prefab })
    private signPass: Prefab = null;
    
    @property({ type: Prefab })
    private signResist: Prefab = null;

    // 牌图片
    @property({ type: [SpriteFrame] })
    private spriteList: SpriteFrame[] = [];

    @property({ type: [Node] })
    private cardZones: Node[] = [];

    private bottomCards: Node[] = null;

    private rightCards: Node[] = null;

    private topCards: Node[] = null;

    private leftCards: Node[] = null;

    start() {}

    update(deltaTime: number) {}

    public clear() {
        for (let i: number = 0; i < 4; i++) {
            this.clearCards(i);
        }
    }

    public getCardArray(clientSeat: number): Node[] {
        if (clientSeat === 0) return this.bottomCards;
        else if(clientSeat === 1) return this.rightCards;
        else if(clientSeat === 2) return this.topCards;
        else if(clientSeat === 3) return this.leftCards;
        return null;
    }

    public setCardArray(clientSeat: number, arr: Node[]) {
        if (clientSeat === 0) this.bottomCards = arr;
        else if(clientSeat === 1) this.rightCards = arr;
        else if (clientSeat === 2) this.topCards = arr;
        else if(clientSeat === 3) this.leftCards = arr;
    }

    public clearCards(clientSeat: number) {
	    let arr: Node[] = this.getCardArray(clientSeat);
        if (!arr) return;
        for (let i: number = 0; i < arr.length; i++) {
            arr[i].destroy();
        }
	    this.setCardArray(clientSeat, null);
    }

    public getCardSprite(card: any): SpriteFrame {
	    let index: number = (card.point - PokerPoint.Ace) * 4;
        if (card.point === PokerPoint.Joker) {
            index = index + (card.suit - PokerSuit.Little);
        }
        else {
            index = index + (card.suit - PokerSuit.Diamond);
        }
	    return this.spriteList[index];
    }

    public playCards(clientSeat: number, cards: any[]) {
        this.clearCards(clientSeat);
        if (!cards || cards.length === 0) return;
        let cardZone = this.cardZones[clientSeat];
        if (!cardZone) return;
        if (!this.cardPlayedOut) return;
        let arr: Node[] = [];
        let posX: number = this.getStartX(cards.length);
        for (let i: number = 0; i < cards.length; i++) {
            let cardNode: Node = instantiate(this.cardPlayedOut);
            if (!cardNode) break;
            cardNode.parent = cardZone;
            let sn: number = i + 1;
            if (sn < 10) cardNode.name = "Card0" + sn.toString();
            else cardNode.name = "Card" + sn.toString();
            cardNode.position = new math.Vec3(posX, 0, 0);
            posX = posX + 50;
            let sprite: Sprite = cardNode.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = this.getCardSprite(cards[i]);
            }
            arr.push(cardNode);
        }
        this.setCardArray(clientSeat, arr);
    }

    public showFlag(clientSeat: number, flag: number) {
        this.clearCards(clientSeat);
	    let cardZone = this.cardZones[clientSeat];
        if (!cardZone) return;
        let prefab: Prefab = null;
        if (flag === 1) prefab = this.signPass;
        else if (flag === 2) prefab = this.signResist;
        if (!prefab) return;
	    let flagNode = instantiate(prefab);
        if (!flagNode) return;
        flagNode.parent = cardZone;
        let arr: Node[] = [];
        arr.push(flagNode);
        this.setCardArray(clientSeat, arr);
    }

    private getStartX(num: number): number {
	    let startX = (1 - num) * 25.0;
        return startX;
    }
}
