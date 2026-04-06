import RedirectTimer from "@/src/components/redirectTimer";
import { redirect } from "next/navigation";

const API_URL = process.env.BASE_URL || "http://localhost:8080";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Redirecting...</h1>
      <p>
        You are being redirected to the original URL. If you are not redirected
        automatically, click the link below:
      </p>
      <RedirectTimer url={`${API_URL}/r/${slug}`} />
      <a href={`${API_URL}/r/${slug}`}>Go to original URL</a>
    </div>
  );
}
