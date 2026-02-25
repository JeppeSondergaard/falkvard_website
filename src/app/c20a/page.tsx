import type { Metadata } from "next";
import Gallery3D from "./Gallery3D";

export const metadata: Metadata = {
  title: "C20A Gallery | Falkvard",
  description: "Immersive 3D gallery experience",
};

export default function C20APage() {
  return <Gallery3D />;
}
