import { SubjectInsightsClient } from "./SubjectInsightsClient";

export default async function SubjectInsightsPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;
  return <SubjectInsightsClient subjectSlug={subjectSlug} />;
}
