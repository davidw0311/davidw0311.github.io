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
    { place: "皇后镇", nights: "3晚" },
    { place: "蒂阿瑙", nights: "1晚" },
    { place: "瓦纳卡", nights: "1晚" },
    { place: "奥拉基 / 库克山", nights: "1晚" },
    { place: "蒂卡波湖", nights: "1晚" },
    { place: "基督城", nights: "1晚" },
  ],
  detailsMissing: [
    "航空公司和航班号",
    "租车公司和取车信息",
    "米尔福德峡湾游船出发时间",
    "住宿名称和确认信息",
    "Skyline 缆车和滑板车门票",
  ],
  sourceNotes: [
    "航班时间没有注明具体时区。",
    "米尔福德峡湾、塔斯曼冰川、Peter's Lookout 和蒂卡波观星都需要根据天气调整。",
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
      ],
    },
    {
      dayNumber: 3,
      date: "11月8日",
      weekday: "星期日",
      route: "皇后镇 → 格林诺奇 → 皇后镇",
      stay: "皇后镇",
      items: [
        { title: "鹿苑高地（Deer Park Heights）" },
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
        { title: "Skyline 空中缆车" },
        { title: "Skyline 滑板车" },
        {
          title: "驾车前往蒂阿瑙",
          detail: "预计约 2 小时，可以放慢节奏欣赏沿途风景。",
        },
      ],
    },
    {
      dayNumber: 5,
      date: "11月10日",
      weekday: "星期二",
      route: "蒂阿瑙 → 米尔福德峡湾 → 皇后镇",
      stay: "皇后镇",
      drive: "全程约 6 小时",
      items: [
        {
          title: "蒂阿瑙 → 米尔福德峡湾",
          detail: "预计约 2 小时，途经埃格林顿谷、镜湖和荷马隧道。",
        },
        {
          title: "米尔福德峡湾游船",
          detail: "原始行程建议选择较早的船班。",
        },
        {
          title: "经蒂阿瑙返回皇后镇",
          detail: "米尔福德峡湾到蒂阿瑙约 2 小时，再到皇后镇约 2 小时。",
        },
      ],
    },
    {
      dayNumber: 6,
      date: "11月11日",
      weekday: "星期三",
      route: "皇后镇 → 箭镇 → 瓦纳卡",
      stay: "瓦纳卡",
      drive: "约 1.5-2 小时",
      items: [
        { title: "皇后镇 → 箭镇" },
        { title: "皇冠山脉观景台" },
        { title: "卡德罗纳" },
        { title: "瓦纳卡湖畔" },
        { title: "孤独的瓦纳卡树" },
      ],
    },
    {
      dayNumber: 7,
      date: "11月12日",
      weekday: "星期四",
      route: "瓦纳卡 → 普卡基湖 → 奥拉基 / 库克山",
      stay: "奥拉基 / 库克山",
      drive: "约 3.5-4 小时",
      items: [
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
        {
          title: "沿 SH80 库克山公路继续前行",
          detail: "原始行程将这里标为全程最美的公路路段。",
        },
        {
          title: "塔斯曼湖和塔斯曼冰川观景台",
          detail: "如果入住后天气晴朗，可以安排这两个地点。",
        },
        { title: "库克山村看日落" },
      ],
    },
    {
      dayNumber: 8,
      date: "11月13日",
      weekday: "星期五",
      route: "奥拉基 / 库克山 → 蒂卡波湖",
      stay: "蒂卡波湖",
      drive: "约 1.5 小时",
      items: [
        {
          title: "胡克谷步道",
          detail: "沿途可看吊桥、胡克河、冰川谷、胡克湖和奥拉基 / 库克山。",
        },
        {
          title: "下午驾车前往蒂卡波湖",
          detail: "沿 SH80 经过普卡基湖，然后继续前往蒂卡波湖。",
        },
        {
          title: "再次前往 Peter's Lookout",
          detail: "只有在 11 月 12 日云层遮住库克山时才需要返回。",
        },
        {
          title: "蒂卡波观星",
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
        { title: "蒂卡波湖 → 费尔利 → 杰拉尔丁 → 基督城" },
      ],
    },
    {
      dayNumber: 10,
      date: "11月15日",
      weekday: "星期日",
      route: "基督城 → 新加坡",
      items: [
        { title: "基督城观光和购物" },
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
