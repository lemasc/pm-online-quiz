import ModalComponent from "@/components/modal";
import { useEffect, useState } from "react";
import { ContentLoading } from "./base";

export default function TimeModal({ submit }: { submit: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 500);
  }, []);

  useEffect(() => {
    if (show) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);
  return (
    <ModalComponent
      size="max-w-2xl"
      title={`หมดเวลาการทำข้อสอบ`}
      show={show}
      titleClass="border-b font-medium font-prompt"
    >
      <div className="px-6 py-4 font-prompt">
        <p className="text-sm md:text-base">
          ขณะนี้หมดเวลาการทำข้อสอบแล้ว ระบบกำลังส่งคำตอบ...
        </p>
        <ContentLoading />
        <p className="text-xs md:text-sm text-gray-600">
          ระบบควรจะเปลี่ยนเส้นทางไปยังหน้าผลการทดสอบภายในไม่กี่วินาที{" "}
          <span className="text-red-500">
            หากไม่ กรุณา
            <a className="text-blue-600 hover:text-blue-800 underline">
              แจ้งปัญหาการใช้งาน
            </a>
          </span>
        </p>
      </div>
    </ModalComponent>
  );
}
