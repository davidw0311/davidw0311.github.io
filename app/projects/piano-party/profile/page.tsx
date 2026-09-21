import type { Metadata } from "next";
import AccountShell from "../account/AccountShell";
import ProfileForm from "./ProfileForm";
export const metadata: Metadata = { title: "Your profile | Piano Party", robots: { index: false, follow: false } };
export default function ProfilePage() { return <AccountShell title="Your place at the piano." intro="Keep your details up to date, manage your password, and get back to making music."><ProfileForm /></AccountShell>; }
