import { EvalJoinClient } from "./EvalJoinClient";
import { parseSessionSlugParam } from "@/lib/session-slug-param";

type EvalSearch = Promise<{ session?: string | string[] }>;

export default async function EvalJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: EvalSearch;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const raw =
    typeof sp.session === "string"
      ? sp.session
      : Array.isArray(sp.session)
        ? sp.session[0]
        : undefined;
  const sessionSlug = parseSessionSlugParam(raw);

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <div className="w-full max-w-lg">
        <p className="text-sm text-on-surface-variant">
          Configure{" "}
          <code className="rounded-sm bg-surface-container-high px-1.5 py-0.5 text-xs text-on-surface">
            NEXT_PUBLIC_CONVEX_URL
          </code>{" "}
          to use evaluator links.
        </p>
      </div>
    );
  }

  return (
    <EvalJoinClient key={`${sessionSlug}:${slug}`} slug={slug} sessionSlug={sessionSlug} />
  );
}
