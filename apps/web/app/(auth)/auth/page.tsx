import type { Metadata } from "next";

import { AuthExperience } from "@/features/silver-platform/auth";

export const metadata: Metadata = {
  title: "ورود به نقره",
  description: "ورود امن، ساخت حساب و بازیابی رمز عبور در نقره.",
  robots: { follow: false, index: false },
};

export default function Page() {
  return <AuthExperience />;
}
