import { redirect } from "next/navigation";

// A tela inicial do Lugora é o mapa.
export default function Home() {
  redirect("/mapa");
}
