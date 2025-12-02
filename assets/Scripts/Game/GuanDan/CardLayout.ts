import { _decorator, Component, Node, Prefab, SpriteFrame, instantiate, tween, math } from 'cc';
import { PokerPoint, PokerSuit } from '../../Common/ConstDefines';
import { Client } from '../Client';
import { GuanDanRoom } from './GuanDanRoom';
import { CardSlot } from './CardSlot';
const { ccclass, property } = _decorator;

/**
 * 手牌布局类
 */
@ccclass('CardLayout')
export class CardLayout extends Component {
    // 显示手牌区域的宽度
    private static readonly Width: number = 1400;

    // 单张牌的最大宽度
    private static readonly MaxSizeX: number = 100;
    
    // 单张牌的最小宽度
    private static readonly MinSizeX: number = 80;

    // 正常状态下牌间纵向偏移
    private static readonly NormalOffsetY = 40;

    // 选牌状态下牌间纵向偏移
    private static readonly SelectOffsetY = 60;

    // 牌图片
    @property({ type: [SpriteFrame] })
    private spriteList: SpriteFrame[] = [];

    @property({ type: Node })
    private cardZone: Node = null;

    // 牌列预制体
    @property({ type: Prefab })
    private prefabCardColumn: Prefab = null;
    
    // 牌槽预制体
    @property({ type: Prefab })
    private prefabCardSlot: Prefab = null;

    private room: GuanDanRoom = null;

    private relocateData: any = null;

    private relocateFrames: number = 0;

    // 列映射表，key-列id，value-列节点
    private columns: Map<number, Node> = new Map();
    
    // 手牌数组映射表，key-列id，value-CardSlot数组（从上到下排列）
    private cardSlots: Map<number, CardSlot[]> = new Map();

    // 手牌映射表，key-牌id，value-CardSlot
    private cardSlotMap: Map<number, CardSlot> = new Map();
    
    // 当前选中的牌id表
    private selectedCardIds: Set<number> = new Set();
    
    // 当前是否在选牌状态
    private isSelecting: boolean = false;
    
    // 当前最大已占用的列id
    private columnId: number = 0;

    // 贡牌或者还贡牌id
    private contributeId: number = -1;

    start() {}

    update(deltaTime: number) {
        this.updateRelocate(deltaTime);
    }

    public setRoom(room: GuanDanRoom) {
        this.room = room;
    }

    private updateRelocate(deltaTime: number) {
        if (!this.relocateData) return;
        if (this.relocateFrames < 2) {
            this.relocateFrames = this.relocateFrames + 1;
            return;
        }
        // 两帧之后再执行，确保调整场景树节点后重新位置场景节点可生效
        this.relocateFrames = 0;
        if (this.relocateData.columns) {
            this.relocateColumns();
        }
        if (this.relocateData.affectedColumnIds) {
            this.relocateCardSlots(this.relocateData.affectedColumnIds, this.relocateData.flag);
        }
        this.relocateData = null;
    }

    // 清空手牌
    public clear() {
        for (let slots of this.cardSlots.values()) {
            for (let slot of slots) {
                slot.node.destroy();
            }
        }
        this.cardSlots = new Map<number, CardSlot[]>();
        this.cardSlotMap = new Map<number, CardSlot>();
        this.selectedCardIds = new Set<number>();
        for (let col of this.columns.values()) {
            col.destroy();
        }
        this.columns = new Map<number, Node>();
        this.isSelecting = false;
        this.contributeId = -1;
        this.columnId = 0;
    }

    public getCardSprite(card: any): SpriteFrame {
        if (!card) return null;
        if (!this.spriteList) return null;
        let index: number = (card.point - PokerPoint.Ace) * 4;
        if (card.point === PokerPoint.Joker) {
            index = index + (card.suit - PokerSuit.Little);
        }
        else {
            index = index + (card.suit - PokerSuit.Diamond);
        }
        return this.spriteList[index];
    }

    // 设置贡牌或者还贡牌id
    private setContributeId(cardId) {
        this.contributeId = cardId;
        let slot = this.cardSlotMap.get(cardId);
        this.setCardSlotColor(slot, cardId, this.selectedCardIds.has(cardId));
    }

    /**
     * 设置手牌
     * @param cards 手牌数组
     * @param gradePoint 级牌点数
     * @param contributeId 贡牌或者还贡牌id
     */
    public setHandCards(cards: any[], gradePoint: number, contributeId: number) {
        this.clear();
        if (!cards || cards.length === 0) return;
        if (!this.cardZone) return;
        if (!this.prefabCardColumn) return;
        if (!this.prefabCardSlot) return;
        this.contributeId = contributeId;
        // 列数
        let cols: number = 0;
        let pointGraph: Map<number, number> = new Map();
        let points: number[] = [];
        let cardArrays: Map<number, any[]> = new Map();
        for (let c of cards) {
            if (!pointGraph.has(c.point)) {
                pointGraph.set(c.point, 1);
                cols = cols + 1;
                points.push(c.point);
                cardArrays.set(c.point, []);
            }
            else {
                pointGraph[c.point] = pointGraph[c.point] + 1;
            }
            let arr: any[] = cardArrays.get(c.point);
            arr.push(c);
        }
        let [ posX, offsetX, scale ] = this.calcDimensionX(cols);
        let posY: number = 0;
        let offsetY: number = this.getOffsetY();
        let rowIdx: number = 0;
        this.columnId = 0;
        for (let i: number = cols - 1; i > -1; i--) {
            let columnNode = instantiate(this.prefabCardColumn);
            if (!columnNode) break;
            columnNode.parent = this.cardZone;
            columnNode.position = new math.Vec3(posX, -100, 0);
            columnNode.scale = new math.Vec3(scale, scale, 1.0);
            posX = posX + offsetX;
            this.columnId = this.columnId + 1;
            this.columns.set(this.columnId, columnNode);
            if (this.columnId < 10) columnNode.name = "CardColumn0" + this.columnId.toString();
            else columnNode.name = "CardColumn" + this.columnId.toString();
            let slotArr: CardSlot[] = [];
            let arr: any[] = cardArrays.get(points[i]);
            posY = offsetY * (arr.length - 1);
            rowIdx = 0;
            for (let j: number = 0; j < arr.length; j++) {
                let slotNode = instantiate(this.prefabCardSlot);
                if (!slotNode) break;
                slotNode.parent = columnNode;
                slotNode.position = new math.Vec3(0, posY, 0.0);
                posY = posY - offsetY;
                rowIdx = rowIdx + 1;
                let slot: CardSlot = slotNode.getComponent(CardSlot);
                if (!slot) break;
                slot.setLayout(this);
                slot.setCard(arr[j], gradePoint);
                if (arr[j].id === this.contributeId) {
                    slot.setColor(new math.Color(255, 220, 80, 255));
                }
                slot.setOriginalColumnId(this.columnId);
                slot.setCurrentColumnId(this.columnId);
                slot.setOriginalRow(rowIdx);
                slotArr.push(slot);
                this.cardSlotMap.set(arr[j].id, slot);
            }
            this.cardSlots.set(this.columnId, slotArr);
        }
    }

    // 计算牌列的横向起始位置、间隔(相邻两列之间的横向位置偏移)、缩放
    private calcDimensionX(cols: number): number[] {
        let scale: number = 1.0;
        let widthMax: number = cols * CardLayout.MaxSizeX;
        let widthMin: number = cols * CardLayout.MinSizeX;
        let sizeX: number = CardLayout.MaxSizeX;
        if (widthMax < CardLayout.Width) {
            scale = 1.0;
        }
        else if (widthMin > CardLayout.Width) {
            sizeX = CardLayout.MinSizeX;
            scale = 0.8;
        }
        else {
            sizeX = CardLayout.Width / cols;
            scale = sizeX / CardLayout.MaxSizeX;
        }
        let offset: number = sizeX;
        let startX: number = 0.0;
        if (widthMax < CardLayout.Width) {
            startX = (sizeX - widthMax) * 0.5;
        }
        else {
            if (widthMin > CardLayout.Width) {
                offset = (CardLayout.Width - sizeX) / (cols - 1);
            }
            startX = (sizeX - CardLayout.Width) * 0.5;
        }
        return [ startX, offset, scale ];
    }

    // 计算牌的间隔(相邻两牌之间的纵向位置偏移)
    private getOffsetY() {
	    let offsetY: number = CardLayout.NormalOffsetY;
        if (this.isSelecting) {
            offsetY = CardLayout.SelectOffsetY;
        }
        return offsetY;
    }

    // 点击到一张牌
    public onCardClick(cardId: number) {
        let slot: CardSlot = this.cardSlotMap.get(cardId);
        if (!slot) return;
        if (!this.isSelecting) {
            this.isSelecting = true;
            this.tweenSelecting();
        }
        if (this.selectedCardIds.has(cardId)) {
            this.selectedCardIds.delete(cardId);
            this.setCardSlotColor(slot, cardId, false);
        }
        else {
            // 判断该列中是否有其他牌已被选中，若无其他牌被选中则选中整列，否则仅选中该牌
            let colId: number = slot.getCurrentColumnId();
            if (this.hasCardSlotSelected(colId)) {
                this.selectedCardIds.add(cardId);
                this.setCardSlotColor(slot, cardId, true);
            }
            else {
                this.selectColumn(colId);
            }
        }
    }

    /**
     * 检测指定列中是否已有牌被选中
     * @param colId 列id
     */
    private hasCardSlotSelected(colId: number): boolean {
	    let slotArr: CardSlot[] = this.cardSlots.get(colId);
        if (!slotArr) return false;
        for (let i: number = 0; i < slotArr.length; i++) {
		    let slot: CardSlot = slotArr[i];
		    let cardId = slot.getCardId();
            if (this.selectedCardIds.has(cardId)) return true;
        }
        return false;
    }

    /**
     * 选中整列牌
     * @param colId 列id
     */
    private selectColumn(colId: number) {
        let slotArr = this.cardSlots.get(colId);
        if (!slotArr) return;
        for (let i: number = 0; i < slotArr.length; i++) {
            let slot: CardSlot = slotArr[i];
            let cardId = slot.getCardId();
            this.selectedCardIds.add(cardId);
            this.setCardSlotColor(slot, cardId, true);
        }
    }

    private setCardSlotColor(slot: CardSlot, cardId: number, isSelected: boolean) {
        if (!slot) return;
        let clr: math.Color = null;
        if (isSelected) clr = new math.Color(140, 120, 200, 255);
        else if (this.contributeId === cardId) clr = new math.Color(255, 220, 80, 255);
        else clr = new math.Color(255, 255, 255, 255);
        slot.setColor(clr);
    }
    
    // 点击到空白区域，取消全部选中
    public onBlankClick() {
        if (this.room) {
            this.room.resetHintCard();
        }
        this.unselectAll();
    }

    public unselectAll() {
        for (let cardId of this.selectedCardIds) {
            let slot: CardSlot = this.cardSlotMap.get(cardId);
            this.setCardSlotColor(slot, cardId, false);
        }
        this.selectedCardIds = new Set<number>();
        if (this.isSelecting) {
            this.isSelecting = false;
            this.tweenSelecting();
        }
    }

    private tweenSelecting() {
        for (let arr of this.cardSlots.values()) {
            this.tweenCardSlotsSelecting(arr);
        }
    }

    private tweenCardSlotsSelecting(arr: CardSlot[]) {
        if (!arr || arr.length < 2) return;
        let offsetY: number = this.getOffsetY();
        let posY: number = offsetY * (arr.length - 1);
        for (let i: number = 0; i < (arr.length - 1); i++) {
            tween(arr[i].node).to(0.2, { position: new math.Vec3(0.0, posY, 0.0) }, { easing: 'linear' }).start();
            posY = posY - offsetY;
        }
    }

    private tweenCardSlots(arr: CardSlot[]) {
        if (!arr || arr.length < 1) return;
        let offsetY: number = this.getOffsetY();
        let posY: number = offsetY * (arr.length - 1);
        for (let i: number = 0; i < arr.length; i++) {
            tween(arr[i].node).to(0.2, { position: new math.Vec3(0.0, posY, 0.0) }, { easing: 'linear' }).start();
            posY = posY - offsetY;
        }
    }

    public setSelectedCardIds(cardIds: number[]) {
        if (!cardIds || cardIds.length < 1) return;
        let tmpSet: Set<number> = new Set();
        for (let i: number = 0; i < cardIds.length; i++) {
            let cardId: number = cardIds[i]
            tmpSet.add(cardId);
            if (!this.selectedCardIds.has(cardId)) {
                let slot: CardSlot = this.cardSlotMap.get(cardId);
                this.setCardSlotColor(slot, cardId, true);
            }
        }
        for (let cardId of this.selectedCardIds) {
            if (!tmpSet.has(cardId)) {
			    let slot: CardSlot = this.cardSlotMap.get(cardId);
                this.setCardSlotColor(slot, cardId, false);
            }
        }
        this.selectedCardIds = tmpSet;
    }

    public getSelectedCardIds(cardIds: number[]) {
        for (let cardId of this.selectedCardIds) {
            cardIds.push(cardId);
        }
    }
    
    // 将选中的牌整理成一列
    public makeOneColumn() {
        if (this.relocateData) return;
        if (this.selectedCardIds.size === 0) return;
        if (this.selectedCardIds.size > 10) {
            // 一列最多只能有10张牌
            Client.Instance.showPromptTip("一列最多只能有10张牌", 3.0);
            return;
        }
        // 被选中的列映射表，key-列id，value-列中被选中的牌的数量
        let tmpMap: Map<number, number> = new Map();
        for (let cardId of this.selectedCardIds) {
            let colId: number = -1;
            let slot: CardSlot = this.cardSlotMap.get(cardId);
            if (slot) {
                colId = slot.getCurrentColumnId();
            }
            if (colId !== -1) {
                if (!tmpMap.has(colId)) {
                    tmpMap.set(colId, 1);
                }
                else {
                    tmpMap.set(colId, tmpMap.get(colId) + 1);
                }
            }
        }
        // 全部牌都被选中的列的ID数组
        let fullSelectedColumnIds: number[] = [];
        for (let [colId, nums] of tmpMap.entries()) {
            let arr: CardSlot[] = this.cardSlots.get(colId);
            if (arr && (arr.length === nums)) {
                fullSelectedColumnIds.push(colId);
            }
        }
        if ((tmpMap.size === 1) && (fullSelectedColumnIds.length === 1)) {
            // 当前只选中了完整的一整列，没必要再另作处理
            return;
        }
        let slotArr: CardSlot[] = null;
        let columnNode: Node = null;
        let columnId: number = -1;
        if (fullSelectedColumnIds.length === 0) {
            // 没有被完整选中的列，创建一个新的列
            if (this.prefabCardColumn) {
                columnNode = instantiate(this.prefabCardColumn);
            }
            if (columnNode) {
                columnNode.parent = this.cardZone;
                this.columnId = this.columnId + 1;
                this.columns.set(this.columnId, columnNode);
                if (this.columnId < 10) columnNode.name = "CardColumn0" + this.columnId.toString();
                else columnNode.name = "CardColumn" + this.columnId.toString();
                columnId = this.columnId;
                slotArr = [];
                this.cardSlots.set(columnId, slotArr);
            }
        }
        else {
            // 将所有被选中的牌归集到第一个完整选中的列，并把该列挪到最右边
            columnId = fullSelectedColumnIds[0];
            columnNode = this.columns.get(columnId);
            // 成为兄弟姐妹节点中最后一个
            let count = this.cardZone.children.length;
            columnNode.setSiblingIndex(count - 1);
            slotArr = this.cardSlots.get(columnId);
        }
        if (!columnNode) return;
        for (let cardId of this.selectedCardIds) {
            let colId: number = -1;
            let slot: CardSlot = this.cardSlotMap.get(cardId);
            if (slot) {
                colId = slot.getCurrentColumnId();
            }
            let arr: CardSlot[] = null;
            if (colId !== -1 && colId !== columnId) {
                arr = this.cardSlots.get(colId);
                this.removeCardSlotFromArray(arr, cardId);
                this.insertCardSlotToArray(slotArr, slot);
                slot.setCurrentColumnId(columnId);
                slot.node.parent = columnNode;
            }
        }
        for (let i: number = slotArr.length - 1; i > -1; i--) {
            let slot: CardSlot = slotArr[i];
            slot.node.setSiblingIndex(i);
        }
        tmpMap.set(columnId, slotArr.length);
        if (fullSelectedColumnIds.length > 1) {
            // 将其他完整选中的列删除
            for (let i: number = 1; i < fullSelectedColumnIds.length; i++) {
                let colId: number = fullSelectedColumnIds[i];
                this.cardSlots.delete(colId);
                if (this.columns.has(colId)) {
                    let tmpNode = this.columns.get(colId);
                    tmpNode.destroy();
                    this.columns.set(colId, null);
                }
            }
        }
        // 注意，这里不能直接给列和牌定位，因为本函数中调整了场景树节点，需要在一帧后才能重新设置位置，否则将不会生效
        this.relocateData = {
            columns: true,
            affectedColumnIds: tmpMap,
            flag: false
        };
    }

    private removeCardSlotFromArray(arr: CardSlot[], cardId: number): boolean {
        if (cardId === -1 || !arr) return false;
        for (let i: number = 0; i < arr.length; i++) {
            let slot: CardSlot = arr[i];
            if (slot.getCardId() === cardId) {
                arr.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    private insertCardSlotToArray(arr: CardSlot[], slot: CardSlot) {
        if (!(slot && arr)) return false;
        let colId1: number = slot.getOriginalColumnId();
        let colId2 = -1;
        let row1: number = slot.getOriginalRow();
        let row2: number = -1;
        let test: boolean = false;
        // arr中按牌从小到大排列，小牌在上面，大牌在下面
        // 从上到下(即从小到大)遍历
        for (let i: number = 0; i < arr.length; i++) {
            let tmpSlot: CardSlot = arr[i];
            colId2 = tmpSlot.getOriginalColumnId();
            row2 = tmpSlot.getOriginalRow();
            if (colId1 > colId2) {
                // slot比c小，在上方
                test = true;
            }
            else if (colId1 === colId2) {
                if (row1 < row2) {
                    // slot比c小，在上方
                    test = true;
                }
            }
            if (test) {
                arr.splice(i, 0, slot);
                return;
            }
        }
        // slot比arr中所有牌都大
        arr.push(slot);
    }

    // 重新计算所有列的横向位置
    private relocateColumns() {
        let cols: number = this.columns.size;
        let [posX, offsetX, scale] = this.calcDimensionX(cols);
        for (let i: number = 0; i < cols; i++) {
            let child: Node = this.cardZone.children[i];
            if (child) {
                child.position = new math.Vec3(posX, -100, 0);
                child.scale = new math.Vec3(scale, scale, 1.0);
            }
            posX = posX + offsetX;
        }
    }

    /**重新计算受影响的列中所有牌的纵向位置
     * @param affectedColumnIds 受影响的列id表
     * @param flag 是否要重置兄弟节点的索引
     */
    private relocateCardSlots(affectedColumnIds: Map<number, number>, flag: boolean) {
        for (let [colId, nums] of affectedColumnIds.entries()) {
            let arr: CardSlot[] = this.cardSlots.get(colId);
            if (!arr) continue;
            if (flag) {
                for (let i: number = arr.length - 1; i > -1; i--) {
                    let slot: CardSlot = arr[i];
                    if (slot) {
                        slot.node.setSiblingIndex(i);
                    }
                }
            }
            this.tweenCardSlots(arr);
        }
    }

    // 撤销理牌
    public resetColumns() {
        if (this.relocateData) return;
        let colId1: number = -1;
        let colId2: number = -1;
        let columnNode: Node = null;
        let slotArr1: CardSlot[] = null;
        let slotArr2: CardSlot[] = null;
        // 受影响的列id表
        let affectedColumnIds: Map<number, number> = new Map();
        for (let [cardId, slot] of this.cardSlotMap.entries()) {
            colId1 = slot.getOriginalColumnId();
            colId2 = slot.getCurrentColumnId();
            if (colId1 !== colId2) {
                columnNode = this.columns.get(colId1);
                slotArr1 = this.cardSlots.get(colId1);
                slotArr2 = this.cardSlots.get(colId2);
                if (!columnNode) {
                    if (!this.prefabCardColumn) return;
                    columnNode = instantiate(this.prefabCardColumn);
                    columnNode.parent = this.cardZone;
                    this.columns.set(colId1, columnNode);
                    if (colId1 < 10) columnNode.name = "CardColumn0" + colId1.toString();
                    else columnNode.name = "CardColumn" + colId1.toString();
                }
                if (!slotArr1) {
                    slotArr1 = [];
                    this.cardSlots.set(colId1, slotArr1);
                }
                this.removeCardSlotFromArray(slotArr2, cardId);
                this.insertCardSlotToArray(slotArr1, slot);
                slot.setCurrentColumnId(colId1);
                slot.node.parent = columnNode;
                affectedColumnIds.set(colId1, 1);
                affectedColumnIds.set(colId2, 1);
                if (slotArr2 && slotArr2.length === 0) {
                    // 该列已无任何牌，删除该列
                    columnNode = this.columns.get(colId2);
                    if (columnNode) {
                        columnNode.destroy();
                    }
                    this.columns.delete(colId2);
                    this.cardSlots.delete(colId2);
                    affectedColumnIds.delete(colId2);
                }
            }
        }
        if (affectedColumnIds.size === 0) {
            //无任何列受影响，直接返回
            return;
        }
        // 全部列id数组
        let columnIds: number[] = [];
        // this.columns.keys()返回的数组已经过排序
        for (let colId of this.columns.keys()) {
            columnIds.push(colId);
        }
        for (let i: number = 0; i < columnIds.length; i++) {
            let colId = columnIds[i];
            columnNode = this.columns.get(colId);
            if (columnNode) {
                columnNode.setSiblingIndex(i);
            }
        }
        // 注意，这里不能直接给列和牌定位，因为本函数中调整了场景树节点，需要在一帧后才能重新设置位置，否则将不会生效
        let relocateData = {
            columns: true,
            affectedColumnIds: affectedColumnIds,
            flag: true
        };
        this.relocateData = relocateData;
    }

    // 删除部分牌
    public removeCards(cardIds: number[]) {
        if (!cardIds || cardIds.length === 0) return;
        let columnNode: Node = null;
        // 受影响的列id表
        let affectedColumnIds: Map<number, number> = new Map();
        let test: boolean = false;
        for (let cardId of cardIds) {
            let colId: number = -1;
            let slot: CardSlot = this.cardSlotMap.get(cardId);
            if (slot) {
                colId = slot.getCurrentColumnId();
            }
            if (colId === -1) continue;
            let arr: CardSlot[] = this.cardSlots.get(colId);
            if (this.removeCardSlotFromArray(arr, cardId)) {
                if (!arr || arr.length === 0) {
                    // 该列已无任何牌，删除该列
                    columnNode = this.columns.get(colId);
                    if (columnNode) {
                        columnNode.destroy();
                    }
                    this.columns.delete(colId);
                    this.cardSlots.delete(colId);
                    affectedColumnIds.delete(colId);
                    test = true;
                }
                else {
                    affectedColumnIds.set(colId, 1);
                }
                slot.node.destroy();
                this.cardSlotMap.delete(cardId);
                this.selectedCardIds.delete(cardId);
            }
        }
        // 注意，这里不能直接给列和牌定位，因为本函数中调整了场景树节点，需要在一帧后才能重新设置位置，否则将不会生效
        let relocateData = {
            columns: test,
            affectedColumnIds: affectedColumnIds,
            flag: false
        };
        this.relocateData = relocateData;
    }
}
