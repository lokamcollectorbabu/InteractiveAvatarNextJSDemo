import dynamic from "next/dynamic";

// Dynamic import with no SSR to avoid workStore issues
const InteractiveAvatar = dynamic(
  () => import("@/components/InteractiveAvatar"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    ),
  },
);

export default function App() {
  return <InteractiveAvatar />;
}