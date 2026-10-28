import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/page-placeholder";
import { strings } from "@/content/pt-BR";

const text = strings.pages.wantToGo;

export const metadata: Metadata = { title: text.title };

export default function WantToGoPage() {
  return <PagePlaceholder title={text.title} text={text.placeholder} />;
}
