export type TripItemKind =
  | "activity"
  | "drive"
  | "flight"
  | "food"
  | "stop"
  | "warning"
  | "weather";

export type TripLink = {
  kind: "map" | "website";
  label: string;
  labelZh: string;
  href: string;
};

export type TripItem = {
  kind: TripItemKind;
  title: string;
  detail?: string;
  time?: string;
  links?: TripLink[];
};

export type TripDay = {
  dayNumber: number;
  date: string;
  dateTime: string;
  weekday: string;
  route: string;
  stay?: string;
  drive?: string;
  items: TripItem[];
};

function mapLink(label: string, labelZh: string, query = label): TripLink {
  return {
    kind: "map",
    label,
    labelZh,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
  };
}

function websiteLink(label: string, labelZh: string, href: string): TripLink {
  return { kind: "website", label, labelZh, href };
}

export const newZealandTrip = {
  slug: "new-zealand-2026-11-06-11-15",
  title: "New Zealand 2026 11.06-11.15",
  shortTitle: "New Zealand 2026",
  region: "South Island road trip",
  description:
    "Ten days from Queenstown to Christchurch, through fiords, alpine roads, glacial lakes, and clear southern skies.",
  dateRange: "6-15 November 2026",
  heroImage: "/assets/generated/trips/new-zealand-2026/aoraki-road.webp",
  heroImageAlt:
    "A road curves beside Lake Pukaki toward the snow-covered Southern Alps",
  overview: [
    { value: "10", label: "days" },
    { value: "6", label: "overnight bases" },
    { value: "3", label: "flight legs" },
  ],
  routeStops: [
    { place: "Queenstown", nights: "2 nights", mapUrl: mapLink("Queenstown map", "皇后镇地图", "Queenstown, New Zealand").href },
    { place: "Te Anau", nights: "2 nights", mapUrl: mapLink("Te Anau map", "蒂阿瑙地图", "Te Anau, New Zealand").href },
    { place: "Wānaka", nights: "1 night", mapUrl: mapLink("Wānaka map", "瓦纳卡地图", "Wanaka, New Zealand").href },
    { place: "Twizel", nights: "1 night", mapUrl: mapLink("Twizel map", "特威泽尔地图", "Twizel, New Zealand").href },
    { place: "Lake Tekapo", nights: "1 night", mapUrl: mapLink("Lake Tekapo map", "蒂卡波湖地图", "Lake Tekapo, New Zealand").href },
    { place: "Christchurch", nights: "1 night", mapUrl: mapLink("Christchurch map", "基督城地图", "Christchurch, New Zealand").href },
  ],
  detailsMissing: [
    "Rental-car agency and pickup details",
    "Accommodation names and confirmations",
    "Deer Park Heights vehicle reservation",
    "Skyline Gondola and Luge tickets",
    "Milford Sound cruise departure time",
    "Flame and Jervois restaurant reservations",
  ],
  sourceNotes: [
    "Flight times are shown without explicit timezone labels.",
    "Milford Sound, the alpine viewpoints, Hooker Valley, and Tekapo stargazing remain weather dependent.",
    "Restaurant and shop hours come from the planning sheet and should be reconfirmed before travel.",
    "The source schedule lists plans but does not include booking references, prices, or confirmation status.",
  ],
  days: [
    {
      dayNumber: 1,
      date: "6 Nov",
      dateTime: "2026-11-06",
      weekday: "Friday",
      route: "Singapore → Auckland",
      stay: "Overnight flight",
      items: [
        {
          kind: "flight",
          time: "18:40",
          title: "Singapore (SIN) → Auckland (AKL)",
          detail: "Overnight international flight.",
          links: [
            mapLink("Singapore Changi", "新加坡樟宜机场", "Singapore Changi Airport"),
            mapLink("Auckland Airport", "奥克兰机场", "Auckland Airport, New Zealand"),
          ],
        },
      ],
    },
    {
      dayNumber: 2,
      date: "7 Nov",
      dateTime: "2026-11-07",
      weekday: "Saturday",
      route: "Auckland → Queenstown",
      stay: "Queenstown",
      items: [
        {
          kind: "flight",
          time: "09:35",
          title: "Arrive in Auckland",
          links: [mapLink("Auckland Airport", "奥克兰机场", "Auckland Airport, New Zealand")],
        },
        {
          kind: "warning",
          title: "5 hr 05 min connection",
          detail: "Collect and recheck luggage, then change terminals.",
        },
        {
          kind: "flight",
          time: "14:40",
          title: "Auckland → Queenstown",
          links: [
            mapLink("Auckland Airport", "奥克兰机场", "Auckland Airport, New Zealand"),
            mapLink("Queenstown Airport", "皇后镇机场", "Queenstown Airport, New Zealand"),
          ],
        },
        {
          kind: "flight",
          time: "16:35",
          title: "Arrive in Queenstown",
          links: [mapLink("Queenstown Airport", "皇后镇机场", "Queenstown Airport, New Zealand")],
        },
        {
          kind: "drive",
          title: "Collect the car and head into town",
          detail: "Allow 15-20 minutes to central Queenstown.",
          links: [mapLink("Central Queenstown", "皇后镇中心", "Queenstown Town Centre, New Zealand")],
        },
        {
          kind: "activity",
          title: "Queenstown city stroll",
          links: [mapLink("Queenstown", "皇后镇", "Queenstown, New Zealand")],
        },
        {
          kind: "food",
          title: "Flame Bar & Grill",
          detail: "Steak and grilled meats. The planning sheet notes 12:00-22:00 and recommends booking ahead.",
          links: [mapLink("Map", "地图", "Flame Bar & Grill Queenstown, New Zealand")],
        },
        {
          kind: "food",
          title: "Patagonia Chocolates",
          detail: "Ice cream and chocolate stop. The planning sheet notes 09:00-22:00.",
          links: [mapLink("Map", "地图", "Patagonia Chocolates Queenstown, New Zealand")],
        },
        {
          kind: "activity",
          title: "Queenstown Gardens evening walk",
          detail: "Finish the day with a lakeside walk through the gardens.",
          links: [mapLink("Map", "地图", "Queenstown Gardens, New Zealand")],
        },
      ],
    },
    {
      dayNumber: 3,
      date: "8 Nov",
      dateTime: "2026-11-08",
      weekday: "Sunday",
      route: "Queenstown → Glenorchy → Queenstown",
      stay: "Queenstown",
      items: [
        {
          kind: "food",
          title: "Fergburger",
          detail: "The planning sheet recommends the venison burger and notes 07:00-02:30.",
          links: [mapLink("Map", "地图", "Fergburger Queenstown, New Zealand")],
        },
        {
          kind: "activity",
          title: "Deer Park Heights",
          detail: "Reserve ahead. The planning sheet notes a daily limit of 80 vehicles.",
          links: [
            mapLink("Map", "地图", "Deer Park Heights, Queenstown, New Zealand"),
            websiteLink("Official website", "官网", "https://deerparkheights.co.nz/"),
          ],
        },
        {
          kind: "food",
          title: "Taco's Land",
          detail: "Mexican food stop. The planning sheet notes 12:00-20:30.",
          links: [mapLink("Map", "地图", "Taco's Land Queenstown, New Zealand")],
        },
        {
          kind: "drive",
          title: "Begin the Glenorchy road trip",
        },
        {
          kind: "stop",
          title: "Bob's Cove",
          detail: "About 14 km from Queenstown, with lake, forest, and mountain views.",
          links: [
            mapLink("Map", "地图", "Bob's Cove Track, Queenstown, New Zealand"),
            websiteLink("DOC track guide", "新西兰环保部步道指南", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/otago/places/queenstown-area/things-to-do/twelve-mile-delta-to-bobs-cove-track/?activity=walking-tramping"),
          ],
        },
        {
          kind: "stop",
          title: "Bennett's Bluff",
          detail:
            "Walk about 630 m from the car park, roughly 15 minutes return, for views across Lake Wakatipu toward Mount Earnslaw and Glenorchy.",
          links: [mapLink("Map", "地图", "Bennett's Bluff Lookout, Glenorchy, New Zealand")],
        },
        {
          kind: "stop",
          title: "Glenorchy Red Boat Shed",
          detail: "The signature red shed, lake, and snow-mountain viewpoint.",
          links: [mapLink("Map", "地图", "Glenorchy Red Shed, New Zealand")],
        },
        {
          kind: "stop",
          title: "Paradise",
          detail:
            "Valley, beech forest, farms, and Southern Alps scenery associated with The Lord of the Rings filming locations.",
          links: [mapLink("Map", "地图", "Paradise, Otago, New Zealand")],
        },
        {
          kind: "activity",
          title: "Optional Isengard Lookout",
          detail: "Add this stop for another Lord of the Rings viewpoint.",
          links: [mapLink("Map", "地图", "Isengard Lookout, Glenorchy, New Zealand")],
        },
        {
          kind: "drive",
          title: "Return to Queenstown on the same road",
        },
        {
          kind: "food",
          title: "Mapo88 Korean Dining Bar",
          detail: "Dinner option. The planning sheet notes that it stays open until 22:00.",
          links: [mapLink("Map", "地图", "Mapo88 Korean Dining Bar Queenstown, New Zealand")],
        },
      ],
    },
    {
      dayNumber: 4,
      date: "9 Nov",
      dateTime: "2026-11-09",
      weekday: "Monday",
      route: "Queenstown → Te Anau",
      stay: "Te Anau",
      drive: "About 2 hr",
      items: [
        {
          kind: "food",
          title: "Brunch at Odd Saint",
          links: [mapLink("Map", "地图", "Odd Saint Queenstown, New Zealand")],
        },
        {
          kind: "activity",
          title: "Skyline Gondola",
          detail: "Buy tickets ahead of the trip.",
          links: [
            mapLink("Map", "地图", "Skyline Queenstown, New Zealand"),
            websiteLink("Official website", "官网", "https://queenstown.skyline.co.nz/"),
          ],
        },
        {
          kind: "activity",
          title: "Skyline Luge",
          detail: "Buy tickets ahead of the trip.",
          links: [
            mapLink("Map", "地图", "Skyline Luge Queenstown, New Zealand"),
            websiteLink("Official website", "官网", "https://queenstown.skyline.co.nz/"),
          ],
        },
        {
          kind: "stop",
          title: "Panorama Terrace Reserve",
          detail: "Stop at Banquito para mates for a broad view over Lake Wakatipu and The Remarkables.",
          links: [mapLink("Map", "地图", "Panorama Terrace Reserve Queenstown, New Zealand")],
        },
        {
          kind: "food",
          title: "Jervois Steak House",
          detail: "Steakhouse option in Queenstown. Reserve ahead if keeping this stop.",
          links: [mapLink("Map", "地图", "Jervois Steak House Queenstown, New Zealand")],
        },
        {
          kind: "drive",
          title: "Drive to Te Anau",
          detail: "Allow about 2 hours and take the scenic drive at an easy pace.",
          links: [mapLink("Te Anau", "蒂阿瑙", "Te Anau, New Zealand")],
        },
        {
          kind: "food",
          title: "Cook steak for dinner",
          detail: "The planning sheet keeps this as the evening meal option in Te Anau.",
        },
      ],
    },
    {
      dayNumber: 5,
      date: "10 Nov",
      dateTime: "2026-11-10",
      weekday: "Tuesday",
      route: "Te Anau → Milford Sound → Te Anau",
      stay: "Te Anau",
      drive: "About 4 hr return",
      items: [
        {
          kind: "food",
          title: "Cook breakfast",
        },
        {
          kind: "drive",
          title: "Te Anau → Milford Sound",
          detail: "Allow about 2 hours via Eglinton Valley, Mirror Lakes, and Homer Tunnel.",
          links: [
            mapLink("Eglinton Valley", "埃格林顿谷", "Eglinton Valley, Fiordland, New Zealand"),
            mapLink("Mirror Lakes", "镜湖", "Mirror Lakes Walk, Fiordland, New Zealand"),
            mapLink("Homer Tunnel", "荷马隧道", "Homer Tunnel, New Zealand"),
            mapLink("Milford Sound", "米尔福德峡湾", "Milford Sound, New Zealand"),
          ],
        },
        {
          kind: "activity",
          title: "Milford Sound cruise",
          detail: "Book the cruise before the trip.",
          links: [
            mapLink("Visitor terminal", "游客码头", "Milford Sound Visitor Terminal, New Zealand"),
            websiteLink("Milford Sound guide", "米尔福德峡湾官网", "https://milfordsoundtourism.nz/experiences/"),
          ],
        },
        {
          kind: "drive",
          title: "Return to Te Anau",
          detail: "Allow about 2 hours from Milford Sound back to Te Anau.",
          links: [mapLink("Te Anau", "蒂阿瑙", "Te Anau, New Zealand")],
        },
        {
          kind: "food",
          title: "Cook steak for dinner",
        },
      ],
    },
    {
      dayNumber: 6,
      date: "11 Nov",
      dateTime: "2026-11-11",
      weekday: "Wednesday",
      route: "Te Anau → Queenstown → Arrowtown → Wānaka",
      stay: "Wānaka",
      drive: "About 3.5-4 hr",
      items: [
        {
          kind: "food",
          title: "Cook breakfast",
        },
        {
          kind: "drive",
          title: "Te Anau → Queenstown",
          detail: "Allow about 2 hours.",
          links: [
            mapLink("Te Anau", "蒂阿瑙", "Te Anau, New Zealand"),
            mapLink("Queenstown", "皇后镇", "Queenstown, New Zealand"),
          ],
        },
        {
          kind: "drive",
          title: "Queenstown → Arrowtown",
          detail: "Allow about 20-25 minutes.",
          links: [
            mapLink("Arrowtown", "箭镇", "Arrowtown, New Zealand"),
            websiteLink("Visitor website", "旅游官网", "https://www.arrowtown.com/"),
          ],
        },
        {
          kind: "food",
          title: "Wolf Coffee Roasters",
          detail: "Coffee stop recommended for a flat white.",
          links: [mapLink("Map", "地图", "Wolf Coffee Roasters Queenstown, New Zealand")],
        },
        {
          kind: "food",
          title: "Brunch at Provisions of Arrowtown",
          links: [mapLink("Map", "地图", "Provisions of Arrowtown, New Zealand")],
        },
        {
          kind: "activity",
          title: "Arrowtown town walk",
          links: [mapLink("Map", "地图", "Arrowtown, New Zealand")],
        },
        {
          kind: "stop",
          title: "Crown Range Lookout",
          links: [mapLink("Map", "地图", "Crown Range Summit, New Zealand")],
        },
        {
          kind: "activity",
          title: "Wānaka Lakefront",
          links: [mapLink("Map", "地图", "Wanaka Lakefront, New Zealand")],
        },
        {
          kind: "activity",
          title: "That Wānaka Tree",
          links: [mapLink("Map", "地图", "That Wanaka Tree, New Zealand")],
        },
        {
          kind: "food",
          title: "Cook steak for dinner",
        },
      ],
    },
    {
      dayNumber: 7,
      date: "12 Nov",
      dateTime: "2026-11-12",
      weekday: "Thursday",
      route: "Wānaka → Lake Pukaki → Twizel",
      stay: "Twizel",
      drive: "About 3-3.5 hr",
      items: [
        {
          kind: "food",
          title: "Cook breakfast",
        },
        {
          kind: "stop",
          title: "Lake Hāwea",
          detail: "Pause at the lakefront or a lookout after leaving Wānaka.",
          links: [mapLink("Map", "地图", "Lake Hawea, New Zealand")],
        },
        {
          kind: "stop",
          title: "Lindis Pass Viewpoint",
          links: [mapLink("Map", "地图", "Lindis Pass Viewpoint, New Zealand")],
        },
        {
          kind: "stop",
          title: "Omarama",
          links: [mapLink("Map", "地图", "Omarama, New Zealand")],
        },
        {
          kind: "stop",
          title: "Peter's Lookout at Lake Pukaki",
          detail: "Priority stop for the classic blue-lake, Mt Cook, and open-road view.",
          links: [mapLink("Map", "地图", "Peter's Lookout, Lake Pukaki, New Zealand")],
        },
        {
          kind: "food",
          title: "Mt Cook Alpine Salmon Shop",
          links: [mapLink("Map", "地图", "Mt Cook Alpine Salmon Shop Lake Pukaki, New Zealand")],
        },
        {
          kind: "drive",
          title: "Arrive in Twizel",
          links: [mapLink("Twizel", "特威泽尔", "Twizel, New Zealand")],
        },
        {
          kind: "warning",
          title: "Four Square Twizel closes at 19:00",
          detail: "Pick up dinner and breakfast supplies before closing.",
          links: [mapLink("Map", "地图", "Four Square Twizel, New Zealand")],
        },
        {
          kind: "food",
          title: "Cook steak for dinner",
        },
      ],
    },
    {
      dayNumber: 8,
      date: "13 Nov",
      dateTime: "2026-11-13",
      weekday: "Friday",
      route: "Twizel → Aoraki / Mt Cook → Lake Tekapo",
      stay: "Lake Tekapo",
      drive: "About 2.5 hr total",
      items: [
        {
          kind: "food",
          title: "Brunch at Mint Folk & Co",
          links: [mapLink("Map", "地图", "Mint Folk & Co Twizel, New Zealand")],
        },
        {
          kind: "drive",
          title: "Twizel → Aoraki / Mt Cook",
          links: [mapLink("Aoraki / Mt Cook", "奥拉基 / 库克山", "Aoraki Mount Cook Village, New Zealand")],
        },
        {
          kind: "weather",
          title: "Tasman Lake and Tasman Glacier Viewpoint",
          links: [
            mapLink("Map", "地图", "Tasman Glacier Viewpoint, New Zealand"),
            websiteLink("DOC track guide", "新西兰环保部步道指南", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/aoraki-mount-cook-national-park/things-to-do/tracks/tasman-glacier-view-track/"),
          ],
        },
        {
          kind: "activity",
          title: "Hooker Valley Track",
          detail:
            "Look for the suspension bridges, Hooker River, glacial valley, Hooker Lake, and views of Aoraki / Mt Cook.",
          links: [
            mapLink("Trailhead", "步道起点", "Hooker Valley Track, New Zealand"),
            websiteLink("DOC track guide", "新西兰环保部步道指南", "https://www.doc.govt.nz/hooker-valley-track?activity=walking-tramping&park=d1b6ac78-fad0-411a-a6e1-47b58d2bdaa3"),
          ],
        },
        {
          kind: "drive",
          title: "Afternoon drive to Lake Tekapo",
          detail: "Allow about 1.5 hours from Mt Cook to Lake Tekapo.",
          links: [mapLink("Lake Tekapo", "蒂卡波湖", "Lake Tekapo, New Zealand")],
        },
        {
          kind: "food",
          title: "Astro Café",
          detail: "Scenic café stop above Lake Tekapo.",
          links: [mapLink("Map", "地图", "Astro Cafe Lake Tekapo, New Zealand")],
        },
        {
          kind: "stop",
          title: "Punatahu Visitor Centre",
          detail: "Stop at the glass-fronted visitor centre beside Lake Pukaki.",
          links: [mapLink("Map", "地图", "Punatahu Visitor Center Lake Pukaki, New Zealand")],
        },
        {
          kind: "stop",
          title: "Four Square Tekapo",
          detail: "Pick up groceries for dinner and breakfast.",
          links: [mapLink("Map", "地图", "Four Square Tekapo, New Zealand")],
        },
        {
          kind: "food",
          title: "Cook steak for dinner",
        },
        {
          kind: "weather",
          title: "Tekapo stargazing and Church of the Good Shepherd",
          detail: "Head out after dark if the sky is clear.",
          links: [
            mapLink("Church map", "教堂地图", "Church of the Good Shepherd Lake Tekapo, New Zealand"),
            mapLink("Dark Sky Project", "暗夜星空项目", "Dark Sky Project, Lake Tekapo, New Zealand"),
            websiteLink("Official website", "官网", "https://www.darkskyproject.co.nz/experiences/"),
          ],
        },
      ],
    },
    {
      dayNumber: 9,
      date: "14 Nov",
      dateTime: "2026-11-14",
      weekday: "Saturday",
      route: "Lake Tekapo → Christchurch",
      stay: "Christchurch",
      drive: "About 3-3.5 hr",
      items: [
        {
          kind: "food",
          title: "Cook breakfast",
        },
        {
          kind: "drive",
          title: "Lake Tekapo → Fairlie → Geraldine → Christchurch",
          links: [
            mapLink("Fairlie", "费尔利", "Fairlie, New Zealand"),
            mapLink("Geraldine", "杰拉尔丁", "Geraldine, New Zealand"),
            mapLink("Christchurch", "基督城", "Christchurch, New Zealand"),
          ],
        },
        {
          kind: "food",
          title: "Fairlie Bakehouse",
          detail: "Stop in Fairlie for the pie recommended in the planning sheet.",
          links: [mapLink("Map", "地图", "Fairlie Bakehouse, New Zealand")],
        },
        {
          kind: "stop",
          title: "Geraldine Lookout",
          links: [mapLink("Map", "地图", "Geraldine Lookout, New Zealand")],
        },
        {
          kind: "activity",
          title: "Christchurch city walk",
          detail: "Link BNZ Centre, the Arts Centre, Cardboard Cathedral, Christchurch Botanic Gardens, and Riverside Market.",
          links: [
            mapLink("BNZ Centre", "BNZ 中心", "BNZ Centre Christchurch, New Zealand"),
            mapLink("Arts Centre", "基督城艺术中心", "The Arts Centre Christchurch, New Zealand"),
            mapLink("Cardboard Cathedral", "纸板大教堂", "Cardboard Cathedral Christchurch, New Zealand"),
            mapLink("Botanic Gardens", "基督城植物园", "Christchurch Botanic Gardens, New Zealand"),
            mapLink("Riverside Market", "河畔市场", "Riverside Market Christchurch, New Zealand"),
          ],
        },
        {
          kind: "food",
          title: "Riverside Market",
          detail: "Browse the market's food stalls during the city walk.",
          links: [mapLink("Map", "地图", "Riverside Market Christchurch, New Zealand")],
        },
      ],
    },
    {
      dayNumber: 10,
      date: "15 Nov",
      dateTime: "2026-11-15",
      weekday: "Sunday",
      route: "Christchurch → Singapore",
      items: [
        {
          kind: "food",
          title: "Brunch at Unknown Chapter Coffee Roasters",
          links: [mapLink("Map", "地图", "Unknown Chapter Coffee Roasters Christchurch, New Zealand")],
        },
        {
          kind: "activity",
          title: "Christchurch sightseeing and shopping",
          links: [mapLink("Christchurch", "基督城", "Christchurch Central City, New Zealand")],
        },
        {
          kind: "food",
          title: "Bessie",
          detail: "Have the beef or lamb recommended in the planning sheet before leaving Christchurch.",
          links: [mapLink("Map", "地图", "Bessie Christchurch, New Zealand")],
        },
        {
          kind: "drive",
          title: "Refuel and return the rental car",
          detail: "Allow 20-30 minutes from central Christchurch to the airport in normal traffic.",
          links: [mapLink("Christchurch Airport", "基督城机场", "Christchurch Airport, New Zealand")],
        },
        {
          kind: "flight",
          time: "17:05",
          title: "Christchurch → Singapore",
          links: [
            mapLink("Christchurch Airport", "基督城机场", "Christchurch Airport, New Zealand"),
            mapLink("Singapore Changi", "新加坡樟宜机场", "Singapore Changi Airport"),
          ],
        },
        {
          kind: "flight",
          time: "22:40",
          title: "Arrive in Singapore",
          links: [mapLink("Singapore Changi", "新加坡樟宜机场", "Singapore Changi Airport")],
        },
      ],
    },
  ] satisfies TripDay[],
} as const;

export const trips = [newZealandTrip] as const;
