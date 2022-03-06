import Container, { Navbar } from "@/components/container";
import { ContentLoading } from "@/components/quiz/viewer";
import { useAuth } from "@/context/auth";
import { useExamList } from "@/shared/examList";
import { ExamLevel } from "@/types/exam";
import { ChevronRightIcon } from "@heroicons/react/outline";
import axios, { Axios } from "axios";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const startSession = async (id: string, token: string) => {
  // Starts a new session
  const { data } = await axios.get(`/api/exam/${id}/start`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  localStorage.setItem(`exam-${id}`, JSON.stringify(data));
};

const restoreSession = async (id: string, token: string) => {
  const data = JSON.parse(localStorage.getItem(`exam-${id}`) as string);
  if (!data) throw new Error("Exam data not found");
  // Try to restore the current session
  await axios.post(`/api/exam/${id}/restore`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const ExamLoading: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const { data: examList } = useExamList(true);
  const { user } = useAuth();
  const router = useRouter();
  const isProcessing = useRef(false);
  useEffect(() => {
    if (!user || !router.isReady) return;
    (async () => {
      if (typeof router.query.path === "string" && !isProcessing.current) {
        try {
          isProcessing.current = true;
          const token = await user.getIdToken();
          await restoreSession(router.query.path, token);
          router.replace({
            pathname: "/exam/[path]/view",
            query: { path: router.query.path },
          });
        } catch (err) {
          setLoading(false);
        } finally {
          isProcessing.current = false;
        }
      }
    })();
  }, [router, user]);

  const startNewSession = async () => {
    if (
      user &&
      typeof router.query.path === "string" &&
      !isProcessing.current
    ) {
      try {
        setLoading(true);
        await startSession(router.query.path, await user.getIdToken());
        router.replace({
          pathname: "/exam/[path]/view",
          query: { path: router.query.path },
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const currentExam =
    examList && typeof router.query.path === "string"
      ? examList.exam.find((v) => v.id === router.query.path)
      : undefined;

  return (
    <Container title="กำลังโหลด" fullscreen>
      <Navbar backBtn title={"คำชี้แจง"} />
      <div className="flex flex-col items-center flex-grow px-6 py-6 md:py-8">
        {currentExam && !loading ? (
          <div className="flex flex-col w-full max-w-2xl font-sarabun content">
            <h2 className="text-center">คำชี้แจง</h2>
            <div className="form-container">
              <b>
                <u>ชื่อแบบทดสอบ</u>
              </b>
              <span>
                {currentExam?.subject} -{" "}
                {currentExam && ExamLevel[currentExam.level]}
              </span>
              <b>
                <u>รายละเอียดแบบทดสอบ</u>
              </b>
              <span>แบบทดสอบนี้มีทั้งหมด 1 ชุด {currentExam.count} ข้อ </span>
              <b>
                <u>เกณฑ์การให้คะแนน</u>
              </b>
              <span>ข้อละ 1 คะแนน คะแนนเต็ม {currentExam.count} คะแนน </span>
              {currentExam.time && (
                <>
                  <b>
                    <u>เวลาในการทำแบบทดสอบ</u>
                  </b>
                  <span>ให้เวลาทำแบบทดสอบ {currentExam.time} นาที</span>
                </>
              )}
            </div>
            <div className="space-y-2">
              <b>
                <u>ข้อปฏิบัติในการทำแบบทดสอบ</u>
              </b>
              <ol>
                <li>
                  <div className="content-sublist space-y-2">
                    แบบทดสอบนี้มีทั้งหมด {currentExam.names.length || 1} ส่วน
                    {currentExam.names.length > 0 && (
                      <ul>
                        {currentExam.names.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
                <li>
                  <p className="content-sublist">
                    แบบทดสอบชุดเป็นแบบเลือกตอบ{" "}
                    {currentExam.level === "SECONDARY" ? 4 : 5} ตัวเลือก
                    ให้เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว
                  </p>
                </li>
                <li>
                  <p className="content-sublist">
                    เมื่อทำข้อสอบเสร็จแล้ว ให้กดปุ่ม “ส่ง”
                    เพื่อบันทึกและส่งคำตอบ
                    <br />
                    <b>หากไม่กดส่ง</b> ระบบจะไม่บันทึกคะแนนและผลการสอบของท่าน
                  </p>
                </li>
              </ol>
            </div>

            <p className="space-y-2">
              <b>
                <u>หมายเหตุ</u>
              </b>
              <ol>
                <li>
                  <p className="content-sublist">
                    ผู้เข้าร่วมที่ทำแบบทดสอบได้{" "}
                    {Math.ceil(0.8 * currentExam.count)} ข้อขึ้นไป (ร้อยละ 80
                    ของจำนวนข้อทั้งหมด) จะได้รับใบประกาศนียบัตร
                  </p>
                </li>
                {currentExam.time && (
                  <li>
                    <p className="content-sublist">
                      หากเวลาในการทำข้อสอบครบ {currentExam.time} นาทีแล้ว
                      ระบบจะส่งคำตอบของท่านโดยอัตโนมัติ
                    </p>
                  </li>
                )}
              </ol>
            </p>
            <div className="flex flex-col items-center justify-center">
              <button
                title="เริ่มทำแบบทดสอบ"
                onClick={() => {
                  startNewSession();
                }}
                className="bg-green-600 hover:bg-green-700 focus:outline-none px-6 py-3 font-prompt font-bold rounded text-lg text-white"
              >
                <ChevronRightIcon className="mr-2 -mt-0.5 w-6 h-6 inline" />
                เริ่มทำแบบทดสอบ
              </button>
            </div>
          </div>
        ) : (
          <ContentLoading />
        )}
      </div>
    </Container>
  );
};

export default ExamLoading;
