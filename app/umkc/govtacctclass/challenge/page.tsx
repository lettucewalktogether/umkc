import { redirect } from "next/navigation";
import { course } from "@/lib/course";

/**
 * The challenge is now the section home page. This redirect keeps older
 * links and bookmarks to /challenge working.
 */
export default function ChallengeRedirect() {
  redirect(course.basePath);
}
