import Link from "next/link";
import { englishMessages } from "@/lib/i18n/messages";

export default function NotFound() {
  return (
    <main className="page">
      <h1>{englishMessages.pageNotFound}</h1>
      <p>{englishMessages.pageNotFoundDescription}</p>
      <Link href="/">Return to {englishMessages.appTitle}</Link>
    </main>
  );
}
