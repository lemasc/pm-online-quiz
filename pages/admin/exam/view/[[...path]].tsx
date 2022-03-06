import QuizManager, { Buttons } from "@/components/quiz/manager";
import { markdown } from "@/components/quiz/markdown";
import { useExamQuery } from "@/shared/exam";
import { ExamLevel, GenericExamModel } from "@/types/exam";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useCollection, useDocument } from "swr-firestore-v9";

const Page: NextPage = () => {
  const router = useRouter();
  const routerTimeout = useRef<NodeJS.Timeout>();

  const { basePath, constructPath } = useExamQuery();

  const getFetchKey = () => (basePath ? `exam/${basePath}` : undefined);
  const { data } = useDocument<GenericExamModel>(getFetchKey() || null, {
    listen: true,
  });

  const isSubSection =
    Array.isArray(router.query.path) && router.query.path.length > 1;

  useEffect(() => {
    if (!data) return;
    if (routerTimeout.current) clearTimeout(routerTimeout.current);
    routerTimeout.current = setTimeout(() => {
      if (!data.exists || !Array.isArray(router.query.path)) {
        router.replace("/admin/exam");
      } else if (!data.exists) {
        router.replace(
          `/admin/exam/view/${router.query.path.slice(0, -1).join("/ ")}`
        );
      }
    }, 200);
  }, [data, router]);

  const { data: sections } = useCollection<Partial<GenericExamModel>>(
    getFetchKey() ? `${getFetchKey()}/sections` : null,
    {
      listen: true,
      orderBy: "name",
    }
  );

  function extractData(data: string, selected: number) {
    const lineBreak = data.indexOf("\n");
    let content = data.slice(0, lineBreak === -1 ? undefined : lineBreak);
    // We display only inline data.
    const blockIndex = data.indexOf("$$");
    if (blockIndex !== -1) {
      content = data.slice(0, blockIndex);
      const choicesIndex = data.indexOf("$$choices\n");
      if (choicesIndex !== -1) {
        let choices = data.slice(choicesIndex);
        const choiceBlockLength = "$$choices\n".length;
        choices = choices.slice(choiceBlockLength);
        const endBlock = choices.indexOf("\n$$");
        choices = choices.slice(0, endBlock === -1 ? undefined : endBlock);
        // Convert choices to ordered list.
        choices = choices
          .split("\n")
          .map(
            (v, i) =>
              `${i + 1}. ${
                selected === i
                  ? `<span class="text-red-600 font-bold">${v}</span>`
                  : `${v}`
              }`
          )
          .join("\n");
        return [content, choices];
      }
    }
    return [content];
  }

  return (
    <QuizManager type="Section" head={data?.name ?? ""}>
      {({ setModal, removeItem }) => (
        <div className="flex flex-col md:flex-row flex-1 overflow-auto">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            <h2 className="text-3xl font-bold">Sections</h2>

            <div className="flex flex-row flex-wrap gap-4 font-sarabun">
              {sections && sections.length > 0 ? (
                sections.map((d) => (
                  <Link
                    key={d.id}
                    href={`/admin/exam/view/${constructPath(d.id).replaceAll(
                      "/sections/",
                      "/"
                    )}`}
                  >
                    <a
                      className="flex py-4 items-center flex-row rounded border bg-white hover:shadow w-full"
                      style={{ maxWidth: "400px" }}
                    >
                      <span className="pl-4 flex flex-col flex-grow gap-1">
                        <b>{d.name}</b>
                        <span className="text-sm text-gray-500">
                          {d.items ? Object.values(d.items).length : 0} items
                        </span>
                      </span>
                      <Buttons
                        className="px-3 py-1 flex-shrink-0"
                        onEdit={() =>
                          setModal({
                            show: true,
                            data: d,
                            path: `sections/${d.id}`,
                          })
                        }
                        onDelete={() => removeItem(`sections/${d.id}`)}
                      />
                    </a>
                  </Link>
                ))
              ) : (
                <span>No data</span>
              )}
            </div>
            <div className="flex flex-row gap-4 pr-4">
              <h2 className="text-3xl font-bold flex-grow">Items</h2>
              <span className="flex-shrink-0 hidden sm:block text-gray-500">
                {data &&
                  data.items &&
                  Object.values(data.items).length > 0 &&
                  `${Object.values(data.items).length} items`}
              </span>
            </div>

            <div className="grid lg:grid-cols-2 2xl:grid-cols-3 flex-row flex-wrap gap-4 font-sarabun">
              {data && data.items && Object.values(data.items).length > 0 ? (
                Object.values(data.items).map((d, i) => {
                  const content = extractData(d.content, d.selected);
                  return (
                    <div
                      key={i}
                      className="p-6 rounded border bg-white truncate"
                    >
                      <div className="flex flex-col w-full truncate text-left">
                        <div className="flex flex-row truncate gap-2">
                          <b className="text-blue-500">{i + 1}. </b>
                          <p
                            className="preview"
                            dangerouslySetInnerHTML={{
                              __html: markdown(content[0]),
                            }}
                          ></p>
                        </div>
                        {content[1] && (
                          <p
                            className="mt-4 text-sm preview pt-4 border-t "
                            dangerouslySetInnerHTML={{
                              __html: markdown(content[1]),
                            }}
                          ></p>
                        )}
                      </div>
                    </div>
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
              <h2 className="text-xl font-bold">{data.name}</h2>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "max-content 1fr" }}
              >
                <b>ประเภท:</b>
                <span>{isSubSection ? "หมวดหมู่ย่อย" : "แบบทดสอบ"}</span>
                {isSubSection ? (
                  <>
                    <b>แสดงชื่อหมวดหมู่ได้:</b>
                    <span>{data.canShowName ? "ใช่" : "ไม่ใช่"}</span>
                  </>
                ) : (
                  <>
                    <b>การจำกัดเวลา:</b>
                    <span>
                      {data.time ? `${data.time} นาที` : "ไม่มีการจำกัดเวลา"}
                    </span>
                  </>
                )}

                {data.subject && (
                  <>
                    <b>รายวิชา:</b>
                    <span>{data.subject}</span>
                  </>
                )}
                {data.level && (
                  <>
                    <b>ระดับชั้น:</b>
                    <span>{ExamLevel[data.level]}</span>
                  </>
                )}
                <b>การสลับข้อ:</b>
                <span>{data.allowRandom ? "สลับข้อได้" : "ไม่สลับข้อ"}</span>
              </div>
              <Buttons
                onEdit={() =>
                  setModal({
                    show: true,
                    data,
                    type: isSubSection ? "Section" : "Exam",
                  })
                }
                onDelete={() => {
                  removeItem(undefined, isSubSection ? "section" : "exam");
                }}
              />
            </div>
          )}
        </div>
      )}
    </QuizManager>
  );
};

export default Page;
