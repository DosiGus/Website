import FlowBuilderClient from "../../../../components/app/FlowBuilderClient";

export default function FlowDetailPage({ params }: { params: { id: string } }) {
  return <FlowBuilderClient flowId={params.id} />;
}
