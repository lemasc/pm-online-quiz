import Container, { Navbar, withExamName } from "@/components/container";
import { useAuth } from "@/context/auth";
import { ExamLevel } from "@/types/exam";
import { DownloadIcon, PrinterIcon } from "@heroicons/react/outline";

import PieChart from "@/components/PieChart";
import dayjs from "@/shared/dayjs";
import { useCurrentSubmission } from "@/shared/examList";
import { formatDateTime } from "@/shared/thaiHelpers";
import type { DurationUnitType } from "dayjs/plugin/duration";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const units: Partial<Record<DurationUnitType, string>> = {
  h: "ชั่วโมง",
  m: "นาที",
  s: "วินาที",
};

type Target = "certificate" | "printout";

const ExamReport: NextPage = () => {
  const { metadata } = useAuth();
  const router = useRouter();
  const [target, setTarget] = useState<Set<Target>>(new Set());
  const { data: submission } = useCurrentSubmission();

  const getDiff = () => {
    if (!submission) return "";
    const diff = dayjs(submission.submittedTime).diff(submission.startTime);
    const duration = dayjs.duration(diff);
    const output = Object.entries(units)
      .map(([_type, unit]) => {
        const type = _type as DurationUnitType;
        const val = type === "h" ? duration.as(type) : duration.get(type);
        if (Math.floor(val) !== 0) return `${Math.floor(val)} ${unit}`;
      })
      .filter((v) => v !== undefined);
    return output.join(" ");
  };

  useEffect(() => {
    if (!router.isReady) return;
    const handleRouteError = (err: Error, url: string) => {
      if (url.includes("certificate")) {
        // Certificate is an API route, which will cause router to emit routeChangeError
        // Simulate finish loading.
        setTimeout(
          () =>
            setTarget((target) => {
              const set = new Set(target);
              set.delete("certificate");
              return set;
            }),
          4000
        );
      }
    };
    router.events.on("routeChangeError", handleRouteError);

    return () => {
      router.events.off("routeChangeError", handleRouteError);
    };
  }, [router]);

  const goTo = (to: Target) => {
    setTarget((target) => new Set(target).add(to));
    router.push({
      pathname: `${to === "certificate" ? "/api" : ""}/exam/[path]/${to}`,
      query: {
        path: router.query.path,
        token: submission?.downloadToken,
      },
    });
  };

  return (
    <Container title={withExamName("ผลการทดสอบ", submission)}>
      <Navbar title="ผลการทดสอบ" backBtn />
      <div className="flex flex-col items-center px-6 md:px-8 py-8 flex-grow w-full">
        {submission && (
          <>
            <div className="w-full max-w-2xl flex flex-col gap-6">
              <h2 className="font-bold text-2xl text-center">ผลการทดสอบ</h2>
              <div className="situation py-4 font-sarabun">
                <b>ชื่อผู้ทำแบบทดสอบ:</b>
                <span>ผู้ใช้งาน DEMO</span>
                <b>ชื่อชุดสอบ:</b>
                <span>
                  {submission.subject} - {ExamLevel[submission.level]}
                </span>
                <b>เวลาเริ่มทำแบบทดสอบ:</b>
                <span>{formatDateTime(submission.startTime)}</span>
                <b>เวลาที่ส่งแบบทดสอบ:</b>
                <span>{formatDateTime(submission.submittedTime)}</span>
                <b>ระยะเวลาที่ใช้ไป:</b>
                <span>{getDiff()}</span>
                <b>คะแนนที่ได้:</b>
                <span>
                  {submission.score}/{submission.total} คะแนน (
                  {((submission.score * 100) / submission.total).toFixed(2)}%)
                </span>
              </div>
              <div className="flex flex-col items-center justify-center w-full">
                <div className="max-w-lg -mt-4 px-4 md:px-0">
                  <PieChart
                    data={[
                      {
                        title: "ข้อที่ตอบถูกต้อง",
                        value: submission.score,
                        color: "#C13C37",
                      },
                      {
                        title: "ข้อที่ตอบผิด",
                        value: submission.total - submission.score,
                        color: "#E38627",
                      },
                    ]}
                  />{" "}
                </div>
              </div>
              {metadata?.pendingEdit && (
                <span className="text-red-600">
                  ไม่สามารถพิมพ์ใบเกียรติบัตรได้ในขณะนี้
                  เนื่องจากคุณได้ส่งคำขอแก้ไขข้อมูลส่วนตัว
                  กรุณารอสักครู่แล้วจึงตรวจสอบใหม่อีกครั้ง (ภายใน 3
                  ชั่วโมงนับจากเวลาที่ส่งคำขอ)
                </span>
              )}
              <div className="grid sm:grid-cols-2 gap-4 items-center justify-center w-full">
                <button
                  onClick={() => goTo("printout")}
                  className="px-4 py-3 flex flex-row gap-2 justify-center items-center bg-quiz-orange-500 hover:bg-quiz-orange-600 disabled:bg-gray-200 disabled:text-gray-500 rounded text-white"
                  disabled={target.has("printout")}
                >
                  <PrinterIcon className="h-6 w-6" />
                  พิมพ์สำเนาข้อสอบ
                </button>
                <button
                  onClick={() => goTo("certificate")}
                  className="px-4 py-3 flex flex-row gap-2 justify-center items-center bg-green-600 hover:bg-green-700 disabled:bg-gray-200  disabled:text-gray-500  rounded text-white"
                  disabled={target.has("certificate") || metadata?.pendingEdit}
                >
                  <DownloadIcon className="h-6 w-6" />
                  ดาวน์โหลดเกียรติบัตร (PDF)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default ExamReport;
