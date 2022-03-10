import Container, { Navbar, withExamName } from "@/components/container";

import { NextPage } from "next";
import { useCurrentSubmission } from "@/shared/examList";
import { useAuth } from "@/context/auth";
import { useEffect, useRef, useState } from "react";
import { ArrowCircleRightIcon } from "@heroicons/react/outline";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
const ModalComponent = dynamic(() => import("@/components/modal"));

interface NextHistoryState {
  url: string;
  options: { shallow: boolean };
}

const ExamFeedback: NextPage = () => {
  const { user, metadata } = useAuth();
  const router = useRouter();

  const { data: submission } = useCurrentSubmission();

  const navigationState = useRef<NextHistoryState>();
  const iframeRef = useRef<HTMLIFrameElement | null>();
  const canNavigate = useRef(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user && submission && !iframeRef.current?.src) {
      user.getIdToken().then((token) => {
        if (!iframeRef.current) return;
        iframeRef.current.src = `/api/feedback?token=${token}`;
      });
    }
  }, [user, submission]);

  const goToReport = () => {
    router.push({
      pathname: "/exam/[path]/report",
      query: router.query,
    });
  };

  useEffect(() => {
    router.prefetch("/exam/[path]/report", `/exam/${router.query.path}/report`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const handleRouteChange = (
      url: string,
      options: NextHistoryState["options"]
    ) => {
      if (canNavigate.current) return;
      navigationState.current = {
        url,
        options,
      };
      setShow(true);
      router.events.emit("routeChangeError");
      throw "routeChange aborted.";
      //}
    };
    // We listen to this event to determine whether to redirect or not
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    if (metadata?.surveyAnswered) {
      canNavigate.current = true;
      goToReport();
    }
  });

  useEffect(() => {
    if (!show) {
      navigationState.current = undefined;
    }
  });

  return (
    <Container title={withExamName("แบบประเมินโครงการ", submission)}>
      <Navbar
        title={
          <div className="flex flex-col">
            <span>กรุณาตอบแบบสอบถามประเมินโครงการ</span>
            <span className="text-sm font-normal text-gray-200">
              โครงการพอมอถามได้ตอบได้
            </span>
          </div>
        }
        backBtn
      >
        {user && submission && (
          <button
            onClick={() => goToReport()}
            title="ข้าม"
            className="px-3 py-2 flex flex-wrap justify-center items-center gap-2 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-300"
          >
            <ArrowCircleRightIcon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">ข้าม</span>
          </button>
        )}
      </Navbar>
      <div className="flex-grow w-full">
        <iframe
          ref={(ref) => (iframeRef.current = ref)}
          className="w-full h-full overflow-hidden"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
        ></iframe>
      </div>
      <ModalComponent
        size="max-w-2xl"
        title={`ต้องการข้ามการทำแบบประเมินหรือไม่`}
        show={show}
        onClose={() => setShow(false)}
        titleClass="border-b font-medium font-prompt"
      >
        <div className="px-6 py-4 font-prompt space-y-4 text-sm md:text-base">
          <p>
            การตอบแบบสอบถามประเมินโครงการจะช่วยให้คณะกรรมการนักเรียน
            ได้นำผลตอบรับของคุณมาใช้ในการปรับปรุงและพัฒนาโครงการอื่น ๆ ต่อไป
          </p>
          <p>
            คุณจำเป็นต้องตอบแบบประเมินเพียง 1 ครั้งเท่านั้น
            หากคุณข้ามการตอบแบบประเมินในครั้งนี้
            หน้าต่างแบบประเมินจะแสดงในการสอบครั้งต่อไป
          </p>
          <p>ต้องการข้ามการทำแบบประเมินหรือไม่?</p>
          <div className="items-center justify-center flex flex-col sm:grid-cols-2 sm:grid gap-3 sm:gap-4 w-full">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="w-full  rounded focus:outline-none py-2 ring-gray-300 hover:bg-gray-400 text-black bg-gray-300 disabled:bg-gray-200"
            >
              ทำแบบประเมินต่อไป
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigationState.current) {
                  canNavigate.current = true;
                  router.push(
                    navigationState.current.url,
                    undefined,
                    navigationState.current.options
                  );
                }
              }}
              className="w-full text-white rounded focus:outline-none px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-200"
            >
              ข้ามการทำแบบประเมิน
            </button>
          </div>
        </div>
      </ModalComponent>
    </Container>
  );
};

export default ExamFeedback;
