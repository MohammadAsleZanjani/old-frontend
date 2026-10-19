import { permanentRedirect } from "next/navigation";

export default function Page() {
  permanentRedirect("/user/buy-silver");
}
