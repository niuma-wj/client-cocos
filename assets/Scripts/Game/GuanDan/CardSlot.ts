import { _decorator, Component, math, Node, Sprite, SpriteFrame } from 'cc';
import { PokerSuit } from '../../Common/ConstDefines';
import { CardLayout } from './CardLayout';
const { ccclass, property } = _decorator;

@ccclass('CardSlot')
export class CardSlot extends Component {
    @property({ type: Sprite })
    private sprite: Sprite = null;

    @property({ type: Node })
    private frp: Node = null;

    private layout: CardLayout = null;

    // 牌ID
    private id: number = -1;

    // 原始列id，从左到右从1开始
    private originalColumnId: number = -1;

    // 原始行序号，从上到下从1开始
    private originalRow: number = -1;

    // 设置当前列ID
    private currentColumnId: number = -1;

    // 是否为逢人配
    private isFrp: boolean = false;

    start() {}

    update(deltaTime: number) { }
    
    public setLayout(layout: CardLayout) {
        this.layout = layout;
    }

    public setCard(card: any, gradePoint: number) {
        this.id = card.id;
        let spriteFrame: SpriteFrame = this.layout.getCardSprite(card);
        this.sprite.spriteFrame = spriteFrame;
        if (card.point === gradePoint && card.suit === PokerSuit.Heart) {
            this.setFrp();
        }
    }

    public getCardId() {
        return this.id;
    }

    // 设置原始列ID
    public setOriginalColumnId(colId: number) {
        this.originalColumnId = colId;
    }

    // 获取原始列ID
    public getOriginalColumnId(): number {
        return this.originalColumnId;
    }

    // 设置原始行序号
    public setOriginalRow(row: number) {
        this.originalRow = row;
    }

    // 获取原始行序号
    public getOriginalRow(): number {
        return this.originalRow;
    }

    // 设置当前列ID
    public setCurrentColumnId(colId: number) {
        this.currentColumnId = colId;
    }

    // 获取当前列ID
    public getCurrentColumnId(): number {
        return this.currentColumnId;
    }

    public setColor(clr: math.Color) {
        this.sprite.color = clr;
        if (this.isFrp && this.frp) {
            // ui.SetImageColor(this.frp, clr);
        }
    }

    public setFrp() {
        this.isFrp = true;
        if (this.frp) this.frp.active = true;
    }

    public onCardClick() {
        if (this.layout) this.layout.onCardClick(this.id);
    }
}
