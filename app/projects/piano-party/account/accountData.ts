export function normalizePhone(value: string) { return value.replace(/[\s().-]/g, ""); }
export function validPhone(value: string) { return /^\+[1-9]\d{7,14}$/.test(normalizePhone(value)); }
export function passwordCredentials(method: "email" | "phone", identifier: string, password: string) {
  if (method === "phone") {
    if (!validPhone(identifier)) throw new Error("Enter a phone number with its country code, such as +6591234567.");
    return { phone: normalizePhone(identifier), password };
  }
  return { email: identifier.trim(), password };
}
export function profileMetadata(name: string, phone: string) {
  if (!name.trim()) throw new Error("Please enter your name.");
  if (name.trim().length > 80) throw new Error("Please use a name of 80 characters or fewer.");
  if (phone.trim() && !validPhone(phone)) throw new Error("Include your phone’s country code, such as +6591234567.");
  return { full_name: name.trim(), contact_phone: normalizePhone(phone) };
}
