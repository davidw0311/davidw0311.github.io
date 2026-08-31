export type TripItemKind =
  | "activity"
  | "drive"
  | "flight"
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
    { place: "Queenstown", nights: "3 nights", mapUrl: mapLink("Queenstown map", "皇后镇地图", "Queenstown, New Zealand").href },
    { place: "Te Anau", nights: "1 night", mapUrl: mapLink("Te Anau map", "蒂阿瑙地图", "Te Anau, New Zealand").href },
    { place: "Wānaka", nights: "1 night", mapUrl: mapLink("Wānaka map", "瓦纳卡地图", "Wanaka, New Zealand").href },
    { place: "Aoraki / Mt Cook", nights: "1 night", mapUrl: mapLink("Aoraki map", "库克山地图", "Aoraki Mount Cook Village, New Zealand").href },
    { place: "Lake Tekapo", nights: "1 night", mapUrl: mapLink("Lake Tekapo map", "蒂卡波湖地图", "Lake Tekapo, New Zealand").href },
    { place: "Christchurch", nights: "1 night", mapUrl: mapLink("Christchurch map", "基督城地图", "Christchurch, New Zealand").href },
  ],
  detailsMissing: [
    "Airlines and flight numbers",
    "Rental-car agency and pickup details",
    "Milford Sound cruise departure time",
    "Accommodation names and confirmations",
    "Skyline Gondola and Luge tickets",
  ],
  sourceNotes: [
    "Flight times are shown without explicit timezone labels.",
    "Milford Sound, Tasman Glacier, Peter's Lookout, and Tekapo stargazing include weather-dependent choices.",
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
          kind: "activity",
          title: "Deer Park Heights",
          links: [
            mapLink("Map", "地图", "Deer Park Heights, Queenstown, New Zealand"),
            websiteLink("Official website", "官网", "https://deerparkheights.co.nz/"),
          ],
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
          kind: "activity",
          title: "Skyline Gondola",
          links: [
            mapLink("Map", "地图", "Skyline Queenstown, New Zealand"),
            websiteLink("Official website", "官网", "https://queenstown.skyline.co.nz/"),
          ],
        },
        {
          kind: "activity",
          title: "Skyline Luge",
          links: [
            mapLink("Map", "地图", "Skyline Luge Queenstown, New Zealand"),
            websiteLink("Official website", "官网", "https://queenstown.skyline.co.nz/"),
          ],
        },
        {
          kind: "drive",
          title: "Drive to Te Anau",
          detail: "Allow about 2 hours and take the scenic drive at an easy pace.",
          links: [mapLink("Te Anau", "蒂阿瑙", "Te Anau, New Zealand")],
        },
      ],
    },
    {
      dayNumber: 5,
      date: "10 Nov",
      dateTime: "2026-11-10",
      weekday: "Tuesday",
      route: "Te Anau → Milford Sound → Queenstown",
      stay: "Queenstown",
      drive: "About 6 hr total",
      items: [
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
          detail: "The source schedule recommends choosing an earlier sailing.",
          links: [
            mapLink("Visitor terminal", "游客码头", "Milford Sound Visitor Terminal, New Zealand"),
            websiteLink("Milford Sound guide", "米尔福德峡湾官网", "https://milfordsoundtourism.nz/experiences/"),
          ],
        },
        {
          kind: "drive",
          title: "Return to Queenstown via Te Anau",
          detail: "Milford Sound to Te Anau is about 2 hours, followed by about 2 hours to Queenstown.",
        },
      ],
    },
    {
      dayNumber: 6,
      date: "11 Nov",
      dateTime: "2026-11-11",
      weekday: "Wednesday",
      route: "Queenstown → Arrowtown → Wānaka",
      stay: "Wānaka",
      drive: "About 1.5-2 hr",
      items: [
        {
          kind: "drive",
          title: "Queenstown → Arrowtown",
          links: [
            mapLink("Arrowtown", "箭镇", "Arrowtown, New Zealand"),
            websiteLink("Visitor website", "旅游官网", "https://www.arrowtown.com/"),
          ],
        },
        {
          kind: "stop",
          title: "Crown Range Lookout",
          links: [mapLink("Map", "地图", "Crown Range Summit, New Zealand")],
        },
        {
          kind: "stop",
          title: "Cardrona",
          links: [
            mapLink("Map", "地图", "Cardrona Hotel, New Zealand"),
            websiteLink("Cardrona Hotel", "卡德罗纳酒店官网", "https://www.cardronahotel.co.nz/"),
          ],
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
      ],
    },
    {
      dayNumber: 7,
      date: "12 Nov",
      dateTime: "2026-11-12",
      weekday: "Thursday",
      route: "Wānaka → Lake Pukaki → Aoraki / Mt Cook",
      stay: "Aoraki / Mt Cook",
      drive: "About 3.5-4 hr",
      items: [
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
          kind: "drive",
          title: "Continue on SH80 Mt Cook Road",
          detail: "The source schedule calls this the most beautiful stretch of the trip.",
          links: [
            mapLink("Aoraki / Mt Cook", "奥拉基 / 库克山", "Aoraki Mount Cook Village, New Zealand"),
            websiteLink("DOC park guide", "新西兰环保部公园指南", "https://www.doc.govt.nz/aorakinationalpark"),
          ],
        },
        {
          kind: "weather",
          title: "Tasman Lake and Tasman Glacier Viewpoint",
          detail: "Add these after check-in if the weather is clear.",
          links: [
            mapLink("Map", "地图", "Tasman Glacier Viewpoint, New Zealand"),
            websiteLink("DOC track guide", "新西兰环保部步道指南", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/aoraki-mount-cook-national-park/things-to-do/tracks/tasman-glacier-view-track/"),
          ],
        },
        {
          kind: "activity",
          title: "Sunset in Mt Cook Village",
          links: [mapLink("Map", "地图", "Aoraki Mount Cook Village, New Zealand")],
        },
      ],
    },
    {
      dayNumber: 8,
      date: "13 Nov",
      dateTime: "2026-11-13",
      weekday: "Friday",
      route: "Aoraki / Mt Cook → Lake Tekapo",
      stay: "Lake Tekapo",
      drive: "About 1.5 hr",
      items: [
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
          detail: "Follow SH80 past Lake Pukaki, then continue to Lake Tekapo.",
          links: [mapLink("Lake Tekapo", "蒂卡波湖", "Lake Tekapo, New Zealand")],
        },
        {
          kind: "weather",
          title: "Peter's Lookout second chance",
          detail: "Return only if cloud blocked the Mt Cook view on 12 November.",
          links: [mapLink("Map", "地图", "Peter's Lookout, Lake Pukaki, New Zealand")],
        },
        {
          kind: "weather",
          title: "Tekapo stargazing",
          detail: "Head out after dark if the sky is clear.",
          links: [
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
          kind: "drive",
          title: "Lake Tekapo → Fairlie → Geraldine → Christchurch",
          links: [
            mapLink("Fairlie", "费尔利", "Fairlie, New Zealand"),
            mapLink("Geraldine", "杰拉尔丁", "Geraldine, New Zealand"),
            mapLink("Christchurch", "基督城", "Christchurch, New Zealand"),
          ],
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
          kind: "activity",
          title: "Christchurch sightseeing and shopping",
          links: [mapLink("Christchurch", "基督城", "Christchurch Central City, New Zealand")],
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
