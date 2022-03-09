import Container, { Navbar } from "@/components/container";
import { useAuth } from "@/context/auth";
import { ExamLevel } from "@/types/exam";
import {
  AcademicCapIcon,
  ClipboardListIcon,
  PencilIcon,
} from "@heroicons/react/outline";

import { NextPage } from "next";
import { LogoutIcon } from "@heroicons/react/outline";
import { useExamList } from "@/shared/examList";
import { ComponentProps, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/shared/thaiHelpers";
import NameEditModal from "@/components/nameModal";

const Card = ({ href, ...props }: Omit<ComponentProps<"a">, "className">) => {
  return (
    <Link href={href as string}>
      <a
        className="flex flex-col rounded border bg-white hover:bg-gray-100 p-4 gap-1 w-full md:w-72"
        {...props}
      />
    </Link>
  );
};

const List: NextPage = () => {
  const { user, signOut, metadata } = useAuth();
  const { data } = useExamList();
  const [editModal, setEditModal] = useState(false);
  const [loadModal, setLoadModal] = useState(false);

  const ExamList = ({ level }: { level: keyof typeof ExamLevel }) => {
    return (
      <>
        {data && data.exam && data.exam.length > 0
          ? data.exam
              .filter((d) => d.level === level)
              .map((d) => (
                <Card key={d.id} href={`/exam/${d.id}`}>
                  <b>
                    {d.subject} - {ExamLevel[d.level]}
                  </b>
                  <span className="text-gray-500 text-sm">
                    {d.time
                      ? `ระยะเวลาในการสอบ ${d.time} นาที`
                      : `ไม่จำกัดระยะเวลาในการสอบ`}
                  </span>
                  <span
                    className={`text-sm ${
                      d.status === "READY"
                        ? "text-blue-500"
                        : d.status === "ON_PROGRESS"
                        ? "text-green-500"
                        : "text-red-500"
                    } font-bold`}
                  >
                    {d.status === "READY"
                      ? "เข้าสู่ระบบการสอบ"
                      : d.status === "ON_PROGRESS"
                      ? "กำลังสอบอยู่"
                      : "สอบแล้ว ไม่สามารถสอบใหม่ได้"}
                  </span>
                </Card>
              ))
          : "ไม่มีข้อมูล"}
      </>
    );
  };
  return (
    <Container title="หน้าหลัก">
      <Navbar title="หน้าหลัก">
        <button
          title="ออกจากระบบ"
          onClick={() => signOut()}
          className="px-3 py-2 flex flex-wrap justify-center items-center gap-2 rounded-lg bg-quiz-orange-500 text-white hover:bg-quiz-orange-600"
        >
          <LogoutIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">ออกจากระบบ</span>
        </button>
      </Navbar>
      <div className="flex flex-col sm:flex-row p-6 lg:p-8 gap-6 bg-white border-b items-start">
        <div className="flex flex-row gap-4 lg:gap-8 items-center flex-grow">
          {user && user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              referrerPolicy="no-referrer"
              src={user?.photoURL.replace("s96", "s75")}
              className="rounded-full h-16 w-16"
              alt="Profile"
            />
          ) : (
            <div className="rounded-full h-16 w-16 bg-gray-300"></div>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-xl md:text-2xl font-bold">
              ยินดีต้อนรับ {metadata?.nameTitle ?? user?.displayName}
              {metadata?.name}
            </h1>
            <span className="text-sm md:text-base text-gray-500">
              {metadata
                ? `ระดับชั้น ม.${metadata.class}/${metadata.level}`
                : `กำลังโหลดข้อมูล...`}
            </span>
          </div>
        </div>
        <button
          title="แก้ไขชื่อ-นามสกุล"
          onClick={() => {
            if (!loadModal) {
              setLoadModal(true);
            } else {
              setEditModal(true);
            }
          }}
          className="place-self-end sm:place-self-start px-3 py-2 flex flex-wrap justify-center items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <PencilIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">แก้ไขชื่อ-นามสกุล</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 py-2 divide-y flex-grow">
        {true && (
          <section className="p-6 flex flex-col gap-4">
            <div className="flex flex-row items-center gap-2 text-quiz-blue-500">
              <AcademicCapIcon className="h-7 w-7" />
              <h3 className="text-xl font-bold">รายละเอียดโครงการ</h3>
            </div>
            <div className="flex flex-row flex-wrap gap-4 font-sarabun items-center">
              {/* TODO: Add project detail here. */}
            </div>
          </section>
        )}
        <section className="p-6 flex flex-col gap-4">
          <div className="flex flex-row items-center gap-2 text-quiz-blue-500">
            <AcademicCapIcon className="h-7 w-7" />
            <h3 className="text-xl font-bold">แบบทดสอบที่สามารถทำได้</h3>
          </div>
          <h4 className="text-lg font-medium text-quiz-blue-500">มัธยมศึกษา</h4>
          <div className="flex flex-row flex-wrap gap-4 font-sarabun items-center">
            <ExamList level="SECONDARY" />
          </div>
          <h4 className="text-lg font-medium text-quiz-blue-500">
            มัธยมศึกษาปลาย
          </h4>
          <div className="flex flex-row flex-wrap gap-4 font-sarabun items-center">
            <ExamList level="UPPER_SECONDARY" />
          </div>
        </section>
        <section className="p-6 flex flex-col gap-4">
          <div className="flex flex-row items-center gap-2 text-quiz-blue-500">
            <ClipboardListIcon className="h-7 w-7" />
            <h3 className="text-xl font-bold">ประวัติการทำแบบทดสอบ</h3>
          </div>
          <div className="flex flex-row flex-wrap gap-4 font-sarabun items-center">
            {data &&
              data.submission &&
              Object.values(data.submission).length > 0 &&
              Object.values(data.submission).map((d) => (
                <Card key={d.id} href={`/exam/${d.id}/report`}>
                  <b>
                    {d.subject} - {ExamLevel[d.level]}
                  </b>
                  <b className="text-green-600 text-sm">
                    {d.score} / {d.total} คะแนน
                  </b>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(d.submittedTime)}
                  </span>
                </Card>
              ))}
          </div>
        </section>
      </div>
      {loadModal && <NameEditModal show={editModal} setShow={setEditModal} />}
    </Container>
  );
};

export default List;
