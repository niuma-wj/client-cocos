import { _decorator, Component, Node } from 'cc';
import { Client } from './Client';
const { ccclass, property } = _decorator;

@ccclass('GameList')
export class GameList extends Component {
    public onGameClicked(event: Event, customEventData: any | null) {
        let name: string = String(customEventData);
        console.log("Game name: ", name);
        if (name) {
            Client.Instance.loadGame(name);
        }
    }
}


