import { jsonError, jsonOk } from "@/lib/api/response";
import { searchMeetings } from "@/lib/meetings/search";
import { getAuthenticatedUser } from "@/lib/meetings/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return jsonError("You must be signed in.", 401);
  }

  if (!q.trim()) {
    return jsonOk({ results: [] });
  }

  const results = await searchMeetings(supabase, user.id, q);

  return jsonOk({ results });
}
