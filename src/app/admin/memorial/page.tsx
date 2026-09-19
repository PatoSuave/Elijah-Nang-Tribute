import { cookies } from "next/headers";
import { AdminLogin, AdminQueue } from "@/components/AdminMemorial";
import { COOKIE, csrfToken, validAdminSession } from "@/lib/admin-auth";
import { adminMessages } from "@/lib/database";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;
const maximumPage = 400;

export default async function MemorialAdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = (await cookies()).get(COOKIE)?.value;
  if (!validAdminSession(session)) return <main className="admin-page"><p className="section-label">Private administration</p><h1>Messages for Elijah</h1><AdminLogin /></main>;
  const requestedPage = Number((await searchParams).page || "1");
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= maximumPage ? requestedPage : 1;
  let result: Awaited<ReturnType<typeof adminMessages>> | null = null;
  let error = "";
  try { result = await adminMessages((page - 1) * PAGE_SIZE, PAGE_SIZE); } catch { error = "The moderation queue is temporarily unavailable."; }
  return <main className="admin-page"><p className="section-label">Private administration</p><h1>Messages for Elijah</h1><p>Review each submission with care before publishing it to the archive.</p>{error ? <p role="alert">{error}</p> : <><AdminQueue entries={result!.messages} csrf={csrfToken(session!)} /><nav className="admin-pagination" aria-label="Moderation queue pages">{page > 1 && <a className="button-secondary" href={`/admin/memorial?page=${page - 1}`}>Newer submissions</a>}{result!.hasMore && page < maximumPage && <a className="button-secondary" href={`/admin/memorial?page=${page + 1}`}>Older submissions</a>}</nav></>}</main>;
}
