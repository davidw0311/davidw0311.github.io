export type TripMapPoint = {
  name: string;
  nameZh: string;
  coordinates: [latitude: number, longitude: number];
};

export type TripMapDay = {
  dayNumber: number;
  route: string;
  routeZh: string;
  flightLegs?: readonly (readonly [startPointIndex: number, endPointIndex: number])[];
  points: readonly TripMapPoint[];
  roadPoints?: readonly TripMapPoint[];
  locations?: readonly TripMapPoint[];
};

const point = (
  name: string,
  nameZh: string,
  latitude: number,
  longitude: number,
): TripMapPoint => ({ name, nameZh, coordinates: [latitude, longitude] });

const singaporeAirport = point("Singapore Changi Airport", "新加坡樟宜机场", 1.3644, 103.9915);
const aucklandAirport = point("Auckland Airport", "奥克兰机场", -37.0082, 174.785);
const queenstownAirport = point("Queenstown Airport", "皇后镇机场", -45.0211, 168.7392);
const queenstown = point("Queenstown", "皇后镇", -45.0312, 168.6626);
const teAnau = point("Te Anau", "蒂阿瑙", -45.4145, 167.7183);
const wanaka = point("Wānaka", "瓦纳卡", -44.695, 169.1368);
const twizel = point("Twizel", "特威泽尔", -44.2547, 170.0983);
const lakeTekapo = point("Lake Tekapo", "蒂卡波湖", -44.0047, 170.4771);
const christchurch = point("Christchurch", "基督城", -43.5321, 172.6362);
const christchurchAirport = point("Christchurch Airport", "基督城机场", -43.4894, 172.5322);

export const newZealandTripMapDays: readonly TripMapDay[] = [
  {
    dayNumber: 1,
    route: "Singapore to Auckland",
    routeZh: "新加坡至奥克兰",
    flightLegs: [[0, 1]],
    points: [singaporeAirport, aucklandAirport],
  },
  {
    dayNumber: 2,
    route: "Auckland to Queenstown",
    routeZh: "奥克兰至皇后镇",
    flightLegs: [[0, 1]],
    points: [aucklandAirport, queenstownAirport, queenstown],
    roadPoints: [
      queenstownAirport,
      point("Frankton", "弗兰克顿", -45.0192, 168.7341),
      point("Frankton Road", "弗兰克顿路", -45.0258, 168.7044),
      queenstown,
    ],
    locations: [
      point("Central Queenstown", "皇后镇中心", -45.0314, 168.6595),
      point("Flame Bar & Grill", "Flame 烧烤餐厅", -45.0326, 168.658),
      point("Patagonia Chocolates", "Patagonia 巧克力店", -45.0312, 168.6598),
      point("Queenstown Gardens", "皇后镇花园", -45.036, 168.6638),
    ],
  },
  {
    dayNumber: 3,
    route: "Queenstown and Glenorchy",
    routeZh: "皇后镇与格林诺奇",
    points: [
      queenstown,
      point("Bob's Cove", "鲍勃湾", -45.0434, 168.4898),
      point("Bennett's Bluff", "贝内特崖观景台", -44.8627, 168.3846),
      point("Glenorchy", "格林诺奇", -44.8505, 168.388),
      point("Paradise", "天堂镇", -44.735, 168.361),
      queenstown,
    ],
    roadPoints: [
      queenstown,
      point("Wilson Bay", "威尔逊湾", -45.0369, 168.5269),
      point("Bob's Cove", "鲍勃湾", -45.0434, 168.4898),
      point("Bennett's Bluff", "贝内特崖观景台", -44.8627, 168.3846),
      point("Glenorchy", "格林诺奇", -44.8505, 168.388),
      point("Paradise Road", "天堂公路", -44.7798, 168.3812),
      point("Paradise", "天堂镇", -44.735, 168.361),
      point("Glenorchy return", "返回格林诺奇", -44.8505, 168.388),
      point("Lake Wakatipu return", "返回瓦卡蒂普湖", -44.968, 168.449),
      queenstown,
    ],
    locations: [
      point("Fergburger", "Fergburger 汉堡店", -45.0315, 168.6596),
      point("Deer Park Heights", "鹿苑高地", -45.019, 168.7205),
      point("Taco's Land", "Taco's Land", -45.031, 168.659),
      point("Glenorchy Red Boat Shed", "格林诺奇红色船屋", -44.849, 168.3839),
      point("Isengard Lookout", "艾辛格观景点", -44.707, 168.348),
      point("Mapo88 Korean Dining Bar", "Mapo88 韩国餐厅", -45.0318, 168.659),
    ],
  },
  {
    dayNumber: 4,
    route: "Queenstown to Te Anau",
    routeZh: "皇后镇至蒂阿瑙",
    points: [queenstown, teAnau],
    roadPoints: [
      queenstown,
      point("Kingston", "金斯顿", -45.3324, 168.7142),
      point("Five Rivers", "五河镇", -45.548, 168.392),
      point("Mossburn", "莫斯本", -45.6696, 168.236),
      teAnau,
    ],
    locations: [
      point("Odd Saint", "Odd Saint 餐厅", -45.0316, 168.6608),
      point("Skyline Gondola", "Skyline 空中缆车", -45.0268, 168.6532),
      point("Skyline Luge", "Skyline 滑板车", -45.025, 168.6465),
      point("Panorama Terrace Reserve", "Panorama Terrace Reserve", -45.0256, 168.6815),
      point("Jervois Steak House", "Jervois 牛排馆", -45.0318, 168.6586),
    ],
  },
  {
    dayNumber: 5,
    route: "Milford Road",
    routeZh: "米尔福德公路",
    points: [
      teAnau,
      point("Eglinton Valley", "埃格林顿谷", -44.971, 168.014),
      point("Mirror Lakes", "镜湖", -44.772, 168.099),
      point("Homer Tunnel", "荷马隧道", -44.758, 167.989),
      point("Milford Sound", "米尔福德峡湾", -44.6716, 167.9256),
      teAnau,
    ],
    roadPoints: [
      teAnau,
      point("Te Anau Downs", "蒂阿瑙唐斯", -45.1527, 167.835),
      point("Eglinton Valley", "埃格林顿谷", -44.971, 168.014),
      point("Mirror Lakes", "镜湖", -44.772, 168.099),
      point("Homer Tunnel", "荷马隧道", -44.758, 167.989),
      point("Milford Sound", "米尔福德峡湾", -44.6716, 167.9256),
      point("Homer Tunnel return", "返回荷马隧道", -44.758, 167.989),
      point("Knobs Flat", "诺布斯平地", -45.013, 167.999),
      teAnau,
    ],
    locations: [
      point("Milford Sound Visitor Terminal", "米尔福德峡湾游客码头", -44.6689, 167.9265),
    ],
  },
  {
    dayNumber: 6,
    route: "Te Anau to Wānaka",
    routeZh: "蒂阿瑙至瓦纳卡",
    points: [
      teAnau,
      queenstown,
      point("Arrowtown", "箭镇", -44.9384, 168.8355),
      point("Crown Range Lookout", "皇冠山脉观景台", -44.999, 168.924),
      wanaka,
    ],
    roadPoints: [
      teAnau,
      point("Mossburn", "莫斯本", -45.6696, 168.236),
      point("Five Rivers", "五河镇", -45.548, 168.392),
      point("Kingston", "金斯顿", -45.3324, 168.7142),
      queenstown,
      point("Arrowtown", "箭镇", -44.9384, 168.8355),
      point("Crown Range Lookout", "皇冠山脉观景台", -44.999, 168.924),
      point("Cardrona", "卡德罗纳", -44.8794, 168.9986),
      wanaka,
    ],
    locations: [
      point("Wolf Coffee Roasters", "Wolf Coffee Roasters", -45.0311, 168.6592),
      point("Provisions of Arrowtown", "Provisions of Arrowtown", -44.9405, 168.8332),
      point("Arrowtown town walk", "箭镇小镇漫步", -44.9387, 168.836),
      point("Wānaka Lakefront", "瓦纳卡湖畔", -44.694, 169.1351),
      point("That Wānaka Tree", "孤独的瓦纳卡树", -44.6986, 169.1171),
    ],
  },
  {
    dayNumber: 7,
    route: "Wānaka to Twizel",
    routeZh: "瓦纳卡至特威泽尔",
    points: [
      wanaka,
      point("Lake Hāwea", "哈威亚湖", -44.611, 169.263),
      point("Lindis Pass Viewpoint", "林迪斯山口观景台", -44.588, 169.652),
      point("Omarama", "奥马拉马", -44.487, 169.968),
      point("Peter's Lookout at Lake Pukaki", "普卡基湖彼得观景台", -44.038, 170.118),
      twizel,
    ],
    roadPoints: [
      wanaka,
      point("Lake Hāwea", "哈威亚湖", -44.611, 169.263),
      point("Tarras", "塔拉斯", -44.834, 169.413),
      point("Lindis Pass Viewpoint", "林迪斯山口观景台", -44.588, 169.652),
      point("Omarama", "奥马拉马", -44.487, 169.968),
      point("Twizel approach", "特威泽尔入口", -44.3106, 170.0804),
      twizel,
    ],
    locations: [
      point("Mt Cook Alpine Salmon Shop", "库克山高山三文鱼店", -44.1836, 170.1588),
      point("Four Square Twizel", "Four Square Twizel", -44.2601, 170.0974),
    ],
  },
  {
    dayNumber: 8,
    route: "Aoraki and Lake Tekapo",
    routeZh: "奥拉基与蒂卡波湖",
    points: [
      twizel,
      point("Aoraki / Mt Cook", "奥拉基 / 库克山", -43.735, 170.096),
      point("Tasman Glacier Viewpoint", "塔斯曼冰川观景台", -43.697, 170.164),
      point("Hooker Valley Track", "胡克谷步道", -43.718, 170.057),
      lakeTekapo,
    ],
    roadPoints: [
      twizel,
      point("Lake Pukaki", "普卡基湖", -44.186, 170.155),
      point("Aoraki approach", "奥拉基入口", -43.884, 170.114),
      point("Aoraki / Mt Cook", "奥拉基 / 库克山", -43.735, 170.096),
      point("Tasman Glacier Road", "塔斯曼冰川路", -43.697, 170.164),
      point("Hooker Valley Track", "胡克谷步道", -43.718, 170.057),
      point("Lake Pukaki return", "返回普卡基湖", -44.186, 170.155),
      lakeTekapo,
    ],
    locations: [
      point("Mint Folk & Co", "Mint Folk & Co", -44.2598, 170.098),
      point("Astro Café", "Astro Café", -43.9871, 170.4648),
      point("Punatahu Visitor Centre", "Punatahu 游客中心", -44.1855, 170.1603),
      point("Four Square Tekapo", "Four Square Tekapo", -44.0055, 170.4765),
      point("Church of the Good Shepherd", "好牧羊人教堂", -44.0031, 170.482),
      point("Dark Sky Project", "暗夜星空项目", -44.004, 170.477),
    ],
  },
  {
    dayNumber: 9,
    route: "Lake Tekapo to Christchurch",
    routeZh: "蒂卡波湖至基督城",
    points: [
      lakeTekapo,
      point("Fairlie", "费尔利", -44.099, 170.828),
      point("Geraldine", "杰拉尔丁", -44.091, 171.244),
      christchurch,
    ],
    roadPoints: [
      lakeTekapo,
      point("Fairlie", "费尔利", -44.099, 170.828),
      point("Geraldine", "杰拉尔丁", -44.091, 171.244),
      point("Ashburton", "阿什伯顿", -43.9036, 171.7486),
      point("Rakaia", "拉凯阿", -43.756, 172.022),
      christchurch,
    ],
    locations: [
      point("Fairlie Bakehouse", "Fairlie Bakehouse", -44.0993, 170.8285),
      point("Geraldine Lookout", "杰拉尔丁观景台", -44.087, 171.239),
      point("BNZ Centre", "BNZ 中心", -43.5335, 172.6351),
      point("The Arts Centre", "基督城艺术中心", -43.5309, 172.627),
      point("Cardboard Cathedral", "纸板大教堂", -43.5321, 172.6438),
      point("Christchurch Botanic Gardens", "基督城植物园", -43.53, 172.6193),
      point("Riverside Market", "河畔市场", -43.533, 172.6347),
    ],
  },
  {
    dayNumber: 10,
    route: "Christchurch to Singapore",
    routeZh: "基督城至新加坡",
    flightLegs: [[1, 2]],
    points: [christchurch, christchurchAirport, singaporeAirport],
    roadPoints: [
      christchurch,
      point("Memorial Avenue", "纪念大道", -43.504, 172.579),
      christchurchAirport,
    ],
    locations: [
      point("Unknown Chapter Coffee Roasters", "Unknown Chapter 咖啡馆", -43.5314, 172.637),
      point("Christchurch Central City", "基督城市中心", -43.532, 172.636),
      point("Bessie", "Bessie 餐厅", -43.5318, 172.6383),
    ],
  },
];
