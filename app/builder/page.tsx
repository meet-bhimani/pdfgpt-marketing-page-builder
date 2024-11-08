import ContentProviderApp from "@/components/destack/editor";
import { getStaticProps } from "pdfgpt-destack-alpha/build/server";

export default async function Page() {
  const props = await getStaticProps().then((d: { props: any }) => d.props);

  return (
    <div style={{ height: "100%", color: "black", backgroundColor: "white" }}>
      <ContentProviderApp data={props?.data} standaloneServer={false} />
    </div>
  );
}
