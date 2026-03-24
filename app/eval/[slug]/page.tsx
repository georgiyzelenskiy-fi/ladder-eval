import { EvalJoinClient } from "./EvalJoinClient";

export default async function EvalJoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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

  return <EvalJoinClient key={slug} slug={slug} />;
}
