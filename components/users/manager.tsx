import { useHistoryRouter } from "@/context/history";
import { useExamQuery } from "@/shared/exam";
import { ChevronLeftIcon } from "@heroicons/react/outline";
import Head from "next/head";
import { useRouter } from "next/router";

export default function UserManager({
  head,
  type,
  children,
}: {
  type: "User" | "Submission";
  children: JSX.Element | JSX.Element[];
  head?: string;
}) {
  const { back } = useHistoryRouter();
  const { query } = useRouter();
  const { constructPath } = useExamQuery();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Head>
        <title>{head ? `${head} : ` : ""}LQM User Editor</title>
      </Head>
      <div className="flex-row p-4 border-b w-full flex items-center">
        <div className="flex flex-grow items-center gap-4">
          {type === "Submission" && (
            <button
              className="flex flex-row gap-2 items-center hover:underline"
              title={"Back"}
              onClick={() =>
                back(
                  Array.isArray(query.path) && query.path.length > 1
                    ? `/admin/users/view/${query.path.slice(0, -1).join("/")}`
                    : `/admin/users`
                )
              }
            >
              <ChevronLeftIcon className="h-6 w-6 flex-shrink-0" />
            </button>
          )}
          <h1 className="font-bold text-lg">Editor</h1>
        </div>
      </div>

      {children}
      <div className="flex flex-col border-t p-4 w-full bg-gray-100 text-sm">
        <span>Copyright &copy; 2021-2022 Lemasc QuizManager</span>
      </div>
    </div>
  );
}
