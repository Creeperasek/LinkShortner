import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Redirect to the backend redirection endpoint
  redirect(`${API_URL}/r/${slug}`);
}
