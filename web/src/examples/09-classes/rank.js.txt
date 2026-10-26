export default function rankFor(score) {
  if (score >= 25) {
    return "Legendary bopper";
  }
  if (score >= 15) {
    return "Quick hands";
  }
  if (score >= 5) {
    return "Nice warm-up";
  }
  return "MISAbot got away this time";
}
