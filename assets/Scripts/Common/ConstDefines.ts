// 常量定义

// 游戏类型
export enum GameType {
    // 无效游戏
    Invalid = 0,
    
    // 空游戏
    Dumb = 1,
    
    // 麻将
    Mahjong = 1021,
    
    // 斗地主
    DouDiZhu = 1022,
    
    // 百人牛牛
    NiuNiu100 = 1023,
    
    // 经典牛牛
    NiuNiu = 1024,
    
    // 红黑大战
    RedBlack = 1025,

    // 炸金花
    ZhaJinHua = 1026,

    // 六安比鸡
    LiuAnBiJi = 1027,

    // 逮狗腿
    Lackey = 1028,

    // 拖拉机
    Tractor = 1029,

    // 掼蛋
    GuanDan = 1030
};

// 游戏场id
export enum DistrictId {
    // 无效游戏场
    Invalid = 0,

    // 逮狗腿新手房
    LackeyBeginner = 1,

    // 逮狗腿初级房
    LackeyModerate = 2,

    // 逮狗腿高级房
    LackeyAdvanced = 3,

    // 逮狗腿顶级房
    LackeyMaster = 4,

    // 掼蛋初级房
    GuanDanBeginner = 5,

    // 掼蛋中级房
    GuanDanModerate = 6,

    // 掼蛋高级房
    GuanDanAdvanced = 7,

    // 掼蛋顶级房
    GuanDanMaster = 8
};

// 网络连接状态
export enum ConnectionState {
    // 未连接
    Disconnect,

    // 正在连接
    Connecting,

    // 已连接
    Connected
};

export enum EnterVenueState {
    // 已离开
    Leaved,

    // 正在进入
    Entering,

    // 已进入
    Entered
};

// 扑克牌点
export enum PokerPoint {
    Invalid = 0,
    Ace = 1,
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    Jack = 11,
    Queen = 12,
    King = 13,
    Joker = 14
};

// 扑克花色
export enum PokerSuit {
    Invalid = 0,
    Diamond = 1,
    Club = 2,
    Heart = 3,
    Spade = 4,
    Little = 5,
    Big = 6
};

// 出牌失败原因
export enum PlayCardFailed {
    // 未知错误
    Unknown = 0,   
    
    // 新一轮出牌不能“不要”
    CanNotPass = 1,

    // 找不到指定的牌
    NotFound = 2,

    // 无效牌型
    Invalid = 3,

    // 要不起
    CanNotPlay = 4
};
