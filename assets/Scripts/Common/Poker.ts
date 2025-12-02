import { PokerPoint, PokerSuit } from "./ConstDefines";

/**
 * 扑克相关方法
 */
export class Poker {
    public static fromInt32(card: number): any {
        let suit: number = card & 0xFF;
        let point: number = card & 0xFF00;
        point = point >> 8;
        let c = {
            point: point,
            suit: suit
        };
        return c;
    }

    public static toInt32(point: number, suit: number): number {
        let val: number = point << 8;
        val = val | suit;
        return val;
    }

    public static getPointName(point: number): string {
        if (point > 1 && point < 11) return point.toString();
        if (point === 1) return "A";   
        else if (point == 11) return "J";
        else if (point == 12) return "Q";
        else if (point == 13) return "K";
        return null;
    }
}


