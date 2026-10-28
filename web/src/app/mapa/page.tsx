import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/page-placeholder";
import { strings } from "@/content/pt-BR";

const text = strings.pages.map;

export const metadata: Metadata = { title: text.title };

export default function MapPage() {
  return <PagePlaceholder title={text.title} text={text.placeholder} />;
}
