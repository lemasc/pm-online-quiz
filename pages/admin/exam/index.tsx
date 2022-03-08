import QuizManager, { Buttons } from "@/components/quiz/manager";
import { ExamLevel, GenericExamModel } from "@/types/exam";
import { NextPage } from "next";
import { useCollection } from "swr-firestore-v9";
import Link from "next/link";

const Page: NextPage = () => {
  const { data } = useCollection<GenericExamModel>("/exam", {
    listen: true,
    orderBy: "name",
  });
  return (
    <QuizManager type="Exam">
      {({ setModal, removeItem }) => (
        <div className="flex flex-1 flex-col gap-4 overflow-auto">
          <div className="overflow-y-auto flex-1 px-4 py-6 space-y-6">
            <h2 className="text-3xl font-bold">Exam</h2>
            <div className="flex flex-row flex-wrap gap-4 font-sarabun">
              {data &&
                data.map((d) => (
                  <Link key={d.id} href={`/admin/exam/view/${d.id}`}>
                    <a
                      className="flex flex-col rounded border bg-white hover:shadow"
                      style={{ width: "20rem" }}
                    >
                      <div className="p-6 gap-1 flex flex-col w-full text-left">
                        <b className="pb-1">{d.name}</b>
                        <span className="text-sm">
                          {d.subject} - {ExamLevel[d.level]}
                        </span>
                        <span className="text-sm text-blue-600">
                          {d.time
                            ? `ระยะเวลาในการสอบ ${d.time} นาที`
                            : "ไม่จำกัดระยะเวลาในการสอบ"}
                        </span>
                      </div>
                      <Buttons
                        className="w-full border-t px-3 py-2 justify-end"
                        onEdit={() =>
                          setModal({ show: true, data: d, path: d.id })
                        }
                        onDelete={() => removeItem(d.id)}
                      />
                    </a>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </QuizManager>
  );
};

export default Page;
