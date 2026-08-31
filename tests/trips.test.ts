import assert from "node:assert/strict";
import test from "node:test";
import { newZealandTrip, type TripItem } from "../data/trips.ts";
import { newZealandTripZh } from "../data/trips.zh.ts";

test("New Zealand itinerary covers every day in order", () => {
  assert.equal(newZealandTrip.title, "New Zealand 2026 11.06-11.15");
  assert.equal(newZealandTrip.days.length, 10);
  assert.deepEqual(
    newZealandTrip.days.map((day) => day.dateTime),
    Array.from({ length: 10 }, (_, index) => `2026-11-${String(index + 6).padStart(2, "0")}`),
  );
  assert.equal(new Set(newZealandTrip.days.map((day) => day.dayNumber)).size, 10);
});

test("overnight bases match the source schedule", () => {
  assert.deepEqual(
    newZealandTrip.days.map((day) => day.stay ?? null),
    [
      "Overnight flight",
      "Queenstown",
      "Queenstown",
      "Te Anau",
      "Queenstown",
      "Wānaka",
      "Aoraki / Mt Cook",
      "Lake Tekapo",
      "Christchurch",
      null,
    ],
  );
});

test("flight times and key weather choices remain explicit", () => {
  const items: TripItem[] = newZealandTrip.days.flatMap((day) => day.items as TripItem[]);
  const flightTimes = items
    .filter((item) => item.kind === "flight")
    .map((item) => item.time);

  assert.deepEqual(flightTimes, ["18:40", "09:35", "14:40", "16:35", "17:05", "22:40"]);
  assert.ok(newZealandTrip.days[6].items.some((item) => item.title.includes("Tasman Glacier")));
  assert.ok(newZealandTrip.days[7].items.some((item) => item.title.includes("stargazing")));
  assert.equal(newZealandTrip.detailsMissing.length, 5);
});

test("Chinese itinerary stays aligned with every English day and item", () => {
  assert.equal(newZealandTripZh.days.length, newZealandTrip.days.length);
  assert.equal(newZealandTripZh.routeStops.length, newZealandTrip.routeStops.length);
  assert.equal(newZealandTripZh.detailsMissing.length, newZealandTrip.detailsMissing.length);
  assert.equal(newZealandTripZh.sourceNotes.length, newZealandTrip.sourceNotes.length);

  newZealandTrip.days.forEach((day, index) => {
    const translation = newZealandTripZh.days[index];
    assert.equal(translation.dayNumber, day.dayNumber);
    assert.equal(translation.items.length, day.items.length);
    assert.ok(translation.route.length > 0);
    translation.items.forEach((item) => assert.ok(item.title.length > 0));
  });
});

test("named itinerary locations expose secure map or official website links", () => {
  const items: TripItem[] = newZealandTrip.days.flatMap((day) => day.items as TripItem[]);
  const linkedTitles = [
    "Deer Park Heights",
    "Bob's Cove",
    "Bennett's Bluff",
    "Glenorchy Red Boat Shed",
    "Paradise",
    "Optional Isengard Lookout",
    "Skyline Gondola",
    "Skyline Luge",
    "Milford Sound cruise",
    "Queenstown → Arrowtown",
    "Crown Range Lookout",
    "Cardrona",
    "Wānaka Lakefront",
    "That Wānaka Tree",
    "Lake Hāwea",
    "Lindis Pass Viewpoint",
    "Omarama",
    "Peter's Lookout at Lake Pukaki",
    "Tasman Lake and Tasman Glacier Viewpoint",
    "Hooker Valley Track",
    "Tekapo stargazing",
    "Christchurch sightseeing and shopping",
  ];

  linkedTitles.forEach((title) => {
    const item = items.find((candidate) => candidate.title === title);
    assert.ok(item, `missing itinerary item: ${title}`);
    assert.ok(item.links && item.links.length > 0, `missing location links: ${title}`);
  });

  const links = items.flatMap((item) => item.links ?? []);
  links.forEach((link) => {
    assert.match(link.href, /^https:\/\//);
    assert.ok(link.labelZh.length > 0);
    if (link.kind === "map") {
      assert.match(link.href, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    }
  });

  newZealandTrip.routeStops.forEach((stop) => {
    assert.match(stop.mapUrl, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  });
});
