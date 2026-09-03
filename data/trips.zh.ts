export type TripItemTranslation = {
  title: string;
  detail?: string;
};

export type TripDayTranslation = {
  dayNumber: number;
  date: string;
  weekday: string;
  route: string;
  stay?: string;
  drive?: string;
  items: TripItemTranslation[];
};

export const newZealandTripZh = {
  title: "新西兰 2026 11.06-11.15",
  region: "南岛自驾之旅",
  description: "十天从皇后镇一路向北抵达基督城，沿途穿越峡湾、高山公路、冰川湖泊和南半球星空。",
  dateRange: "2026年11月6日至15日",
  overview: [
    { value: "10", label: "天" },
    { value: "6", label: "住宿地" },
    { value: "3", label: "段航班" },
  ],
  routeStops: [
    { place: "皇后镇", nights: "2晚" },
    { place: "蒂阿瑙", nights: "2晚" },
    { place: "瓦纳卡", nights: "1晚" },
    { place: "特威泽尔", nights: "1晚" },
    { place: "蒂卡波湖", nights: "1晚" },
    { place: "基督城", nights: "1晚" },
  ],
  detailsMissing: [
    "租车公司和取车信息",
    "住宿名称和确认信息",
    "鹿苑高地车辆预约",
    "Skyline 缆车和滑板车门票",
    "米尔福德峡湾游船出发时间",
    "Flame 和 Jervois 餐厅预订",
  ],
  sourceNotes: [
    "航班时间没有注明具体时区。",
    "米尔福德峡湾、高山观景点、胡克谷步道和蒂卡波观星都需要根据天气调整。",
    "餐厅和商店营业时间来自计划表，出发前应再次确认。",
    "原始行程只列出计划，没有预订编号、价格或确认状态。",
  ],
  days: [
    {
      dayNumber: 1,
      date: "11月6日",
      weekday: "星期五",
      route: "新加坡 → 奥克兰",
      stay: "夜宿航班",
      items: [
        {
          title: "新加坡（SIN）→ 奥克兰（AKL）",
          detail: "国际过夜航班。",
        },
      ],
    },
    {
      dayNumber: 2,
      date: "11月7日",
      weekday: "星期六",
      route: "奥克兰 → 皇后镇",
      stay: "皇后镇",
      items: [
        { title: "抵达奥克兰" },
        {
          title: "转机 5小时05分钟",
          detail: "领取并重新托运行李，然后前往另一座航站楼。",
        },
        { title: "奥克兰 → 皇后镇" },
        { title: "抵达皇后镇" },
        {
          title: "取车后前往市区",
          detail: "到皇后镇中心预计需要 15-20 分钟。",
        },
        { title: "皇后镇市区漫步" },
        {
          title: "Flame Bar & Grill",
          detail: "牛排和烤肉。计划表标注营业时间为 12:00-22:00，并建议提前预订。",
        },
        {
          title: "Patagonia Chocolates",
          detail: "冰淇淋和巧克力。计划表标注营业时间为 09:00-22:00。",
        },
        {
          title: "傍晚漫步皇后镇花园",
          detail: "沿湖边和花园散步，为当天收尾。",
        },
      ],
    },
    {
      dayNumber: 3,
      date: "11月8日",
      weekday: "星期日",
      route: "皇后镇 → 格林诺奇 → 皇后镇",
      stay: "皇后镇",
      items: [
        {
          title: "Fergburger",
          detail: "计划表推荐鹿肉汉堡，并标注营业时间为 07:00-02:30。",
        },
        {
          title: "鹿苑高地（Deer Park Heights）",
          detail: "请提前预约。计划表标注每天限额 80 辆车。",
        },
        {
          title: "Taco's Land",
          detail: "墨西哥卷饼。计划表标注营业时间为 12:00-20:30。",
        },
        { title: "开始格林诺奇公路之旅" },
        {
          title: "Bob's Cove",
          detail: "距离皇后镇约 14 公里，可以欣赏湖泊、森林和群山。",
        },
        {
          title: "Bennett's Bluff 观景台",
          detail: "从停车场步行约 630 米，往返约 15 分钟，可以眺望瓦卡蒂普湖、厄恩斯洛山和格林诺奇。",
        },
        {
          title: "格林诺奇红色船屋",
          detail: "经典红色船屋、湖泊和雪山取景点。",
        },
        {
          title: "Paradise",
          detail: "山谷、山毛榉森林、农场和南阿尔卑斯山景色，也是《指环王》取景区域。",
        },
        {
          title: "可选：艾辛格观景点",
          detail: "如果时间允许，可以增加这个《指环王》取景点。",
        },
        { title: "沿原路返回皇后镇" },
        {
          title: "Mapo88 Korean Dining Bar",
          detail: "晚餐选择。计划表标注营业至 22:00。",
        },
      ],
    },
    {
      dayNumber: 4,
      date: "11月9日",
      weekday: "星期一",
      route: "皇后镇 → 蒂阿瑙",
      stay: "蒂阿瑙",
      drive: "约 2 小时",
      items: [
        { title: "Odd Saint 早午餐" },
        {
          title: "Skyline 空中缆车",
          detail: "请在出发前提前购票。",
        },
        {
          title: "Skyline 滑板车",
          detail: "请在出发前提前购票。",
        },
        {
          title: "Panorama Terrace Reserve",
          detail: "在 Banquito para mates 停留，从高处俯瞰瓦卡蒂普湖和卓越山脉。",
        },
        {
          title: "Jervois Steak House",
          detail: "皇后镇牛排选择。如果保留此站，请提前预订。",
        },
        {
          title: "驾车前往蒂阿瑙",
          detail: "预计约 2 小时，可以放慢节奏欣赏沿途风景。",
        },
        {
          title: "晚餐自己煎牛排",
          detail: "计划表将此项保留为蒂阿瑙晚餐选择。",
        },
      ],
    },
    {
      dayNumber: 5,
      date: "11月10日",
      weekday: "星期二",
      route: "蒂阿瑙 → 米尔福德峡湾 → 蒂阿瑙",
      stay: "蒂阿瑙",
      drive: "往返车程约 4 小时",
      items: [
        { title: "早餐自己煮" },
        {
          title: "蒂阿瑙 → 米尔福德峡湾",
          detail: "预计约 2 小时，途经埃格林顿谷、镜湖和荷马隧道。",
        },
        {
          title: "米尔福德峡湾游船",
          detail: "请在出发前提前预订游船。",
        },
        {
          title: "返回蒂阿瑙",
          detail: "米尔福德峡湾返回蒂阿瑙约 2 小时。",
        },
        { title: "晚餐自己煎牛排" },
      ],
    },
    {
      dayNumber: 6,
      date: "11月11日",
      weekday: "星期三",
      route: "蒂阿瑙 → 皇后镇 → 箭镇 → 瓦纳卡",
      stay: "瓦纳卡",
      drive: "约 3.5-4 小时",
      items: [
        { title: "早餐自己煮" },
        {
          title: "蒂阿瑙 → 皇后镇",
          detail: "预计约 2 小时。",
        },
        {
          title: "皇后镇 → 箭镇",
          detail: "预计约 20-25 分钟。",
        },
        {
          title: "Wolf Coffee Roasters",
          detail: "计划表推荐在这里喝澳白。",
        },
        { title: "Provisions of Arrowtown 早午餐" },
        { title: "箭镇小镇漫步" },
        { title: "皇冠山脉观景台" },
        { title: "瓦纳卡湖畔" },
        { title: "孤独的瓦纳卡树" },
        { title: "晚餐自己煎牛排" },
      ],
    },
    {
      dayNumber: 7,
      date: "11月12日",
      weekday: "星期四",
      route: "瓦纳卡 → 普卡基湖 → 特威泽尔",
      stay: "特威泽尔",
      drive: "约 3-3.5 小时",
      items: [
        { title: "早餐自己煮" },
        {
          title: "哈威亚湖",
          detail: "离开瓦纳卡后，可以在湖边或观景台短暂停留。",
        },
        { title: "林迪斯山口观景台" },
        { title: "奥马拉马" },
        {
          title: "普卡基湖 Peter's Lookout",
          detail: "优先停靠点，可以拍摄蓝色湖水、库克山和开阔公路的经典画面。",
        },
        { title: "Mt Cook Alpine Salmon Shop" },
        {
          title: "抵达特威泽尔",
        },
        {
          title: "Four Square Twizel 19:00 关门",
          detail: "请在关门前购买晚餐和早餐食材。",
        },
        { title: "晚餐自己煎牛排" },
      ],
    },
    {
      dayNumber: 8,
      date: "11月13日",
      weekday: "星期五",
      route: "特威泽尔 → 奥拉基 / 库克山 → 蒂卡波湖",
      stay: "蒂卡波湖",
      drive: "全程约 2.5 小时",
      items: [
        { title: "Mint Folk & Co 早午餐" },
        { title: "特威泽尔 → 奥拉基 / 库克山" },
        { title: "塔斯曼湖和塔斯曼冰川观景台" },
        {
          title: "胡克谷步道",
          detail: "沿途可看吊桥、胡克河、冰川谷、胡克湖和奥拉基 / 库克山。",
        },
        {
          title: "下午驾车前往蒂卡波湖",
          detail: "库克山到蒂卡波湖车程约 1.5 小时。",
        },
        {
          title: "Astro Café",
          detail: "在蒂卡波湖上方的景观咖啡厅停留。",
        },
        {
          title: "Punatahu Visitor Centre",
          detail: "打卡普卡基湖畔的玻璃外墙游客中心。",
        },
        {
          title: "Four Square Tekapo",
          detail: "购买晚餐和早餐食材。",
        },
        { title: "晚餐自己煎牛排" },
        {
          title: "蒂卡波观星和好牧羊人教堂",
          detail: "如果夜空晴朗，天黑后再出发。",
        },
      ],
    },
    {
      dayNumber: 9,
      date: "11月14日",
      weekday: "星期六",
      route: "蒂卡波湖 → 基督城",
      stay: "基督城",
      drive: "约 3-3.5 小时",
      items: [
        { title: "早餐自己煮" },
        { title: "蒂卡波湖 → 费尔利 → 杰拉尔丁 → 基督城" },
        {
          title: "Fairlie Bakehouse",
          detail: "在费尔利品尝计划表推荐的派。",
        },
        { title: "杰拉尔丁观景台" },
        {
          title: "基督城市区步行路线",
          detail: "串联 BNZ 中心、基督城艺术中心、纸板大教堂、基督城植物园和河畔市场。",
        },
        {
          title: "河畔市场",
          detail: "在市区步行途中逛市场里的小吃摊。",
        },
      ],
    },
    {
      dayNumber: 10,
      date: "11月15日",
      weekday: "星期日",
      route: "基督城 → 新加坡",
      items: [
        { title: "Unknown Chapter Coffee Roasters 早午餐" },
        { title: "基督城观光和购物" },
        {
          title: "Bessie",
          detail: "离开基督城前品尝计划表推荐的牛排或羊排。",
        },
        {
          title: "加满油并归还租车",
          detail: "正常交通情况下，从基督城市中心到机场预计需要 20-30 分钟。",
        },
        { title: "基督城 → 新加坡" },
        { title: "抵达新加坡" },
      ],
    },
  ] satisfies TripDayTranslation[],
} as const;
