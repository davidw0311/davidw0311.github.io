import type { Metadata } from "next";
import AccountShell from "../account/AccountShell";
import LoginForm from "./LoginForm";
export const metadata: Metadata = { title: "Log in | Piano Party", robots: { index: false, follow: false } };
export default function LoginPage() { return <AccountShell title="A little more you." intro="Create your Piano Party profile, or sign in and make yourself at home."><LoginForm /></AccountShell>; }
