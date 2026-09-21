import { test } from "node:test";
import assert from "node:assert/strict";
import { passwordCredentials, profileMetadata, validPhone } from "../app/projects/piano-party/account/accountData.ts";

test("email login trims the identifier without altering the password", () => {
  assert.deepEqual(passwordCredentials("email", " player@example.com ", " my password "), { email: "player@example.com", password: " my password " });
});
test("phone login requires a country code and normalizes display punctuation", () => {
  assert.deepEqual(passwordCredentials("phone", "+65 (9123) 4567", "secret"), { phone: "+6591234567", password: "secret" });
  assert.throws(() => passwordCredentials("phone", "91234567", "secret"), /country code/);
  assert.equal(validPhone("+0123456789"), false);
  assert.equal(validPhone("+6591234567<script>"), false);
});
test("profile updates contain only display metadata, not identity fields", () => {
  assert.deepEqual(profileMetadata(" Player ", "+65 9123-4567"), { full_name: "Player", contact_phone: "+6591234567" });
});
test("optional contact phone can be cleared", () => {
  assert.deepEqual(profileMetadata("Player", ""), { full_name: "Player", contact_phone: "" });
});
test("invalid profile data is rejected before contacting Supabase", () => {
  assert.throws(() => profileMetadata("   ", ""), /name/);
  assert.throws(() => profileMetadata("x".repeat(81), ""), /80/);
  assert.throws(() => profileMetadata("Player", "91234567"), /country code/);
});
