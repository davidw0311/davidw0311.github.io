export type TripItemKind =
  | "activity"
  | "drive"
  | "flight"
  | "stop"
  | "warning"
  | "weather";

export type TripItem = {
  kind: TripItemKind;
  title: string;
  detail?: string;
  time?: string;
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
    { place: "Queenstown", nights: "3 nights" },
    { place: "Te Anau", nights: "1 night" },
    { place: "Wānaka", nights: "1 night" },
    { place: "Aoraki / Mt Cook", nights: "1 night" },
    { place: "Lake Tekapo", nights: "1 night" },
    { place: "Christchurch", nights: "1 night" },
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
        },
        {
          kind: "flight",
          time: "16:35",
          title: "Arrive in Queenstown",
        },
        {
          kind: "drive",
          title: "Collect the car and head into town",
          detail: "Allow 15-20 minutes to central Queenstown.",
        },
        {
          kind: "activity",
          title: "Queenstown city stroll",
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
        },
        {
          kind: "drive",
          title: "Begin the Glenorchy road trip",
        },
        {
          kind: "stop",
          title: "Bob's Cove",
          detail: "About 14 km from Queenstown, with lake, forest, and mountain views.",
        },
        {
          kind: "stop",
          title: "Bennett's Bluff",
          detail:
            "Walk about 630 m from the car park, roughly 15 minutes return, for views across Lake Wakatipu toward Mount Earnslaw and Glenorchy.",
        },
        {
          kind: "stop",
          title: "Glenorchy Red Boat Shed",
          detail: "The signature red shed, lake, and snow-mountain viewpoint.",
        },
        {
          kind: "stop",
          title: "Paradise",
          detail:
            "Valley, beech forest, farms, and Southern Alps scenery associated with The Lord of the Rings filming locations.",
        },
        {
          kind: "activity",
          title: "Optional Isengard Lookout",
          detail: "Add this stop for another Lord of the Rings viewpoint.",
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
        },
        {
          kind: "activity",
          title: "Skyline Luge",
        },
        {
          kind: "drive",
          title: "Drive to Te Anau",
          detail: "Allow about 2 hours and take the scenic drive at an easy pace.",
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
        },
        {
          kind: "activity",
          title: "Milford Sound cruise",
          detail: "The source schedule recommends choosing an earlier sailing.",
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
        },
        {
          kind: "stop",
          title: "Crown Range Lookout",
        },
        {
          kind: "stop",
          title: "Cardrona",
        },
        {
          kind: "activity",
          title: "Wānaka Lakefront",
        },
        {
          kind: "activity",
          title: "That Wānaka Tree",
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
        },
        {
          kind: "stop",
          title: "Lindis Pass Viewpoint",
        },
        {
          kind: "stop",
          title: "Omarama",
        },
        {
          kind: "stop",
          title: "Peter's Lookout at Lake Pukaki",
          detail: "Priority stop for the classic blue-lake, Mt Cook, and open-road view.",
        },
        {
          kind: "drive",
          title: "Continue on SH80 Mt Cook Road",
          detail: "The source schedule calls this the most beautiful stretch of the trip.",
        },
        {
          kind: "weather",
          title: "Tasman Lake and Tasman Glacier Viewpoint",
          detail: "Add these after check-in if the weather is clear.",
        },
        {
          kind: "activity",
          title: "Sunset in Mt Cook Village",
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
        },
        {
          kind: "drive",
          title: "Afternoon drive to Lake Tekapo",
          detail: "Follow SH80 past Lake Pukaki, then continue to Lake Tekapo.",
        },
        {
          kind: "weather",
          title: "Peter's Lookout second chance",
          detail: "Return only if cloud blocked the Mt Cook view on 12 November.",
        },
        {
          kind: "weather",
          title: "Tekapo stargazing",
          detail: "Head out after dark if the sky is clear.",
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
        },
        {
          kind: "drive",
          title: "Refuel and return the rental car",
          detail: "Allow 20-30 minutes from central Christchurch to the airport in normal traffic.",
        },
        {
          kind: "flight",
          time: "17:05",
          title: "Christchurch → Singapore",
        },
        {
          kind: "flight",
          time: "22:40",
          title: "Arrive in Singapore",
        },
      ],
    },
  ] satisfies TripDay[],
} as const;

export const trips = [newZealandTrip] as const;
