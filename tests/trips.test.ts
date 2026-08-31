import assert from "node:assert/strict";
import test from "node:test";
import { newZealandTrip, type TripItem } from "../data/trips.ts";

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
