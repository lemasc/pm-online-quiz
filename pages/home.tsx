import Container, { Navbar } from "@/components/container";
import { useAuth } from "@/context/auth";
import { ExamLevel } from "@/types/exam";
import {
  AcademicCapIcon,
  ChevronUpIcon,
  ClipboardListIcon,
  PencilIcon,
} from "@heroicons/react/outline";

import { NextPage } from "next";
import { LogoutIcon } from "@heroicons/react/outline";
import { useExamList } from "@/shared/examList";
import { ComponentProps, Fragment, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/shared/thaiHelpers";
import NameEditModal from "@/components/nameModal";
import { Disclosure } from "@headlessui/react";

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

const NameList2 = ({ title, names }: { title: string; names: string[] }) => {
  return (
    <div className="content">
      <h4 className="text-quiz-orange-600 font-prompt">{title}</h4>
      <ul>
        {names.map((v) => (
          <li key={`${title}_${v}`}>
            <div className="content-sublit">{v}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const NameList = ({ title, names }: { title: string; names: string[] }) => {
  return (
    <div className="w-full rounded-lg">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button
              className={[
                "flex items-center space-x-4 w-full px-4 py-2 font-medium text-left focus:outline-none focus-visible:ring",
                "text-quiz-orange-700  hover:bg-quiz-orange-200 focus-visible:ring-quiz-orange-600",
                open
                  ? "rounded-t-lg bg-quiz-orange-200"
                  : "rounded-lg bg-quiz-orange-100",
              ].join(" ")}
            >
              <span className="font-prompt flex-grow">{title}</span>
              <ChevronUpIcon
                className={`${open ? "transform rotate-180" : ""} w-5 h-5`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="w-full text-gray-800 content-font bg-quiz-orange-50 rounded-b-lg">
              <div className="content min-h-0">
                <ul className="overflow-auto min-h-0 h-full max-h-[250px] w-full px-6 py-3">
                  {names.map((v) => (
                    <li key={`${title}_${v}`}>
                      <div className="content-sublit">{v}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
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
        <section className="p-6 flex flex-col gap-4">
          <div className="flex flex-row items-center gap-2 text-quiz-blue-500">
            <AcademicCapIcon className="h-7 w-7" />
            <h3 className="text-xl font-bold">รายละเอียดโครงการ</h3>
          </div>
          <div className="content font-sarabun indent">
            <h4 className="text-quiz-blue-500 font-prompt">คำอธิบายโครงการ</h4>
            <p className="pb-2">
              คณะกรรมการนักเรียนฝ่ายวิชาการประจำปีการศึกษา 2564
              โรงเรียนมัธยมสาธิตวัดพระศรีมหาธาตุ มหาวิทยาลัยราชภัฏพระนคร
              ได้ตระหนักถึงความสำคัญของการศึกษา
              นอกจากจะมีกระบวนการการเรียนการสอนโดยเน้นผู้เรียนเป็นสำคัญในห้องเรียนแล้ว
              ยังจำเป็นต้องมีกิจกรรมด้านวิชาการอื่นเพื่อให้นักเรียนได้แสดงความสามารถ
              มีเจตคติที่ดี และใฝ่เรียนรู้ในรายวิชาต่าง ๆ
              จึงได้จัดทำโครงการแข่งขันตอบปัญหาวิชาการขึ้น
              เพื่อเปิดโอกาสให้นักเรียนได้แสดงความสามารถด้านวิชาการ
              ซึ่งจะเป็นประโยชน์ และเพิ่มศักยภาพในการเรียนรู้อย่างสูงสุด
            </p>
            <h4 className="text-quiz-blue-500 font-prompt">
              คณะผู้จัดทำโครงการ
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 py-2">
              <NameList
                title="พัฒนาระบบเว็บไซต์โดย"
                names={["นายศักดิธัช ธนาสดใส", "นายกิตติพิชญ์ ปิ่นถาวรรักษ์"]}
              />
              <NameList
                title="ออกแบบเว็บไซต์โดย"
                names={[
                  "นางสาวกัญญาภัทร อิทธิพงศ์เมธี",
                  "นางสาวชนิดาภา สารรัตน์",
                  "นางสาวมณีน่าน ทัพผดุง",
                  "นางสาวรังสิตกานต์ ขจรรัตนวณิชย์",
                  "นายสุชน ปิติการ",
                ]}
              />
              <NameList
                title="รวบรวมข้อสอบโดย"
                names={[
                  "นางสาวขวัญชนก ทรงจรัสพงศ์",
                  "นางสาวญาณิศา ชินโสตร์",
                  "นางสาวณัฐณิชา จิระธรรมกิจกุล",
                  "นางสาวณัฐธิตา โอภาสเสถียร",
                  "นางสาวปาลินี ศรีสุทธางกูร",
                  "นายปิติพงศ์ ผลเเก้ว",
                  "นางสาววรินธร พุทธรักษา",
                  "นายศิวา สุภาวงษ์",
                  "นางสาวพชรพร เริงฤทธิ์",
                ]}
              />
            </div>
          </div>
        </section>
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
