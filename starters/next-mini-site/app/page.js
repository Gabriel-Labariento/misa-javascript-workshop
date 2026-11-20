import ProfileCard from "@/components/ProfileCard";

export default function HomePage() {
  return (
    <section className="page">
      <h1>Hello, welcome to my site!</h1>

      <ProfileCard
        name="Niles Cabrera"
        role="BS MIS · Lead developer"
        bio="I build small web tools and never say no to turon."
        tags={["HTML", "CSS", "JavaScript"]}
      />
    </section>
  );
}
