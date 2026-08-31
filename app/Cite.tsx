import { course } from "@/lib/course";
import { referenceMap } from "@/lib/references";

/**
 * Renders an author-date citation linking to the entry on the references page.
 * Unknown keys render visibly rather than silently disappearing.
 */
export default function Cite({
  k,
  parens = true,
}: {
  k: string | string[];
  parens?: boolean;
}) {
  const keys = Array.isArray(k) ? k : [k];
  const parts = keys.map((key) => {
    const ref = referenceMap[key];
    return { key, text: ref ? ref.inText : `?${key}` };
  });

  return (
    <span className="cite">
      {parens && "("}
      {parts.map((p, i) => (
        <span key={p.key}>
          {i > 0 && "; "}
          <a href={`${course.basePath}/references#${p.key}`}>{p.text}</a>
        </span>
      ))}
      {parens && ")"}
    </span>
  );
}
