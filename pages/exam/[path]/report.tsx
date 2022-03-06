import Container, { Navbar } from "@/components/container";
import { useAuth } from "@/context/auth";
import { ExamLevel, ExamSubmission } from "@/types/exam";
import {
  AcademicCapIcon,
  ClipboardListIcon,
  DownloadIcon,
  PrinterIcon,
} from "@heroicons/react/outline";

import { NextPage } from "next";
import { LogoutIcon } from "@heroicons/react/outline";
import { useExamList } from "@/shared/examList";
import { useRouter } from "next/router";
import { formatDateTime } from "@/shared/thaiHelpers";
import dayjs from "dayjs";
import Duration, { DurationUnitType } from "dayjs/plugin/duration";
dayjs.extend(Duration);

const units: Partial<Record<DurationUnitType, string>> = {
  h: "ชั่วโมง",
  m: "นาที",
  s: "วินาที",
};
const List: NextPage = () => {
  const { metadata } = useAuth();
  const { push, query } = useRouter();
  const { data } = useExamList();

  const submission =
    typeof query.path === "string" && data && data.submission[query.path];

  const getDiff = () => {
    if (!submission) return "";
    const diff = dayjs(submission.submittedTime).diff(submission.startTime);
    const duration = dayjs.duration(diff);
    const output = Object.entries(units)
      .map(([_type, unit]) => {
        const type = _type as DurationUnitType;
        const val = type === "h" ? duration.as(type) : duration.get(type);
        if (Math.floor(val) !== 0) return `${Math.ceil(val)} ${unit}`;
      })
      .filter((v) => v !== undefined);
    return output.join(" ");
  };
  return (
    <Container title="หน้าหลัก">
      <Navbar title="ผลการทดสอบ" backBtn />
      <div className="flex flex-col items-center px-6 md:px-8 py-8 flex-grow w-full">
        {data && submission && (
          <>
            <div className="w-full max-w-3xl flex flex-col gap-6">
              <h2 className="font-bold text-2xl text-center">ผลการทดสอบ</h2>
              <div className="situation py-4">
                <b>ชื่อผู้ทำแบบทดสอบ:</b>
                <span>
                  {metadata?.nameTitle}
                  {metadata?.name}
                </span>
                <b>ชื่อชุดสอบ:</b>
                <span>
                  {submission.subject} - {ExamLevel[submission.level]}
                </span>
                <b>เวลาเริ่มทำแบบทดสอบ:</b>
                <span>{formatDateTime(submission.startTime)}</span>
                <b>เวลาที่ส่งทำแบบทดสอบ:</b>
                <span>{formatDateTime(submission.submittedTime)}</span>
                <b>ระยะเวลาที่ใช้ไป:</b>
                <span>{getDiff()}</span>
                <b>คะแนนที่ได้:</b>
                <span>
                  {submission.score}/{submission.total} คะแนน (
                  {(submission.score / submission.total).toFixed(2)}%)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 items-center justify-center w-full">
                <button className="px-4 py-3 flex flex-row gap-2 justify-center items-center bg-quiz-orange-500 rounded text-white">
                  <PrinterIcon className="h-6 w-6" />
                  พิมพ์สำเนาข้อสอบ
                </button>
                <button className="px-4 py-3 flex flex-row gap-2 justify-center items-center  bg-green-600 rounded text-white">
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

export default List;
