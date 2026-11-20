export default function ProfileCard({ name, role, bio, tags }) {
  return (
    <article className="card">
      <img className="card-photo" src="/misabot.png" alt="MISAbot smiling" />
      <div className="card-body">
        <h2>{name}</h2>
        <p className="card-role">{role}</p>
        <p>{bio}</p>
        <ul className="card-tags">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
