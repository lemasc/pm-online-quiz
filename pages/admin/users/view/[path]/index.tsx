import UserManager from "@/components/users/manager";
import { UserMetadata } from "@/context/auth";
import { ExamLevel, ExamModel, ExamSubmission } from "@/types/exam";
import dayjs from "@/shared/dayjs";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useCollection, useDocument } from "swr-firestore-v9";

const Page: NextPage = () => {
  const router = useRouter();
  const routerTimeout = useRef<NodeJS.Timeout>();

  const getFetchKey = () =>
    typeof router.query.path === "string"
      ? `users/${router.query.path}`
      : undefined;
  const { data } = useDocument<UserMetadata>(getFetchKey() || null, {
    listen: true,
  });

  useEffect(() => {
    if (!data) return;
    if (routerTimeout.current) clearTimeout(routerTimeout.current);
    routerTimeout.current = setTimeout(() => {
      if (!data.exists || typeof router.query.path !== "string") {
        router.replace("/admin/users");
      }
    }, 200);
  }, [data, router]);

  const { data: sections } = useCollection<ExamSubmission>(
    getFetchKey() ? `${getFetchKey()}/submissions` : null,
    {
      listen: true,
      parseDates: ["startTime", "submittedTime"],
      orderBy: ["submittedTime", "desc"],
    }
  );

  const { data: exams } = useCollection<ExamModel>("/exam");
  console.log(exams);
  return (
    <UserManager type="Submission" head={data?.name ?? ""}>
      <div className="flex flex-col md:flex-row flex-1 overflow-auto">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <h2 className="text-3xl font-bold">Submissions</h2>

          <div className="flex flex-row flex-wrap gap-4 font-sarabun">
            {exams && sections && sections.length > 0 ? (
              sections.map((d) => {
                const exam = Object.values(exams).find((v) => v.id === d.id);
                return (
                  <Link
                    key={d.id}
                    href={`/admin/users/view/${router.query.path}/submission/${d.id}`}
                  >
                    <a
                      className="flex py-4 items-center flex-row rounded border bg-white hover:shadow w-full"
                      style={{ maxWidth: "400px" }}
                    >
                      <span className="pl-4 flex flex-col flex-grow gap-1">
                        <b className="pb-1">
                          {exam?.subject} - {exam && ExamLevel[exam.level]}
                        </b>
                        <span className="text-sm text-blue-500">
                          ได้คะแนน {d.score}/{d.total}
                        </span>
                        <span className="text-sm text-gray-500">
                          ส่งเมื่อ {dayjs(d.submittedTime).format("LLL")} น.
                        </span>
                      </span>
                    </a>
                  </Link>
                );
              })
            ) : (
              <span>No data</span>
            )}
          </div>
        </div>
        {data && (
          <div
            className="flex-shrink-0 flex flex-col gap-4 p-4 border-t md:border-t-0 md:border-l font-sarabun text-sm"
            style={{ minWidth: "300px" }}
          >
            <h2 className="text-xl font-bold">
              {data.nameTitle}
              {data.name}
            </h2>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "max-content 1fr" }}
            >
              <b>ระดับชั้น:</b>
              <span>
                {data.class}/{data.level}
              </span>
              <b>เลขประจำตัว:</b>
              <span>{data.studentId}</span>
            </div>
          </div>
        )}
      </div>
    </UserManager>
  );
};

export default Page;
