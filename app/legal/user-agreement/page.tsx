import { permanentRedirect } from "next/navigation";

export default function LegacyUserAgreementPage() {
  permanentRedirect("/legal/terms");
}
