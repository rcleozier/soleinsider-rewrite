import { permanentRedirect } from "next/navigation";

// Consolidated into /app so there is a single canonical install page.
export default function DownloadPage() {
  permanentRedirect("/app");
}
