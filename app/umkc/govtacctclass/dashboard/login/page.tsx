import LoginForm from "./LoginForm";
import { course } from "@/lib/course";

export const metadata = { title: "Instructor Sign-in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Instructor access</p>
        <h1>Sign in to the dashboard</h1>
        <p className="lede">
          The dashboard aggregates class results for {course.instructor}. It is
          gated by a shared instructor passcode set in the deployment
          environment.
        </p>
      </div>

      <LoginForm next={next ?? `${course.basePath}/dashboard`} />

      <div className="panel">
        <span className="label">Students</span>
        <p>
          You do not need this page. Score presentations on the{" "}
          <a href={`${course.basePath}/eval`}>evaluation page</a> and complete
          the <a href={`${course.basePath}/assessment`}>assessment</a>, then send
          the exported spreadsheet file to {course.instructor}.
        </p>
      </div>
    </>
  );
}
