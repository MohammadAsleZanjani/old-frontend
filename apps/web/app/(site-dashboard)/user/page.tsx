import type { Metadata } from "next";

import { UserRouteFrame } from "./UserRouteFrame";

export const metadata: Metadata = {
  robots: "noindex,nofollow",
  title: "داشبورد کاربری نقره",
};

export default function UserPage() {
  return <UserRouteFrame />;
}
