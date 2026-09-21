"use client";
import Link from "next/link";
import { useAccount } from "./useAccount";
export default function AccountLink() {
  const { user } = useAccount();
  return <Link href={`/projects/piano-party/${user ? "profile" : "login"}/`}>{user ? "My profile" : "Log in / Sign up"}</Link>;
}
