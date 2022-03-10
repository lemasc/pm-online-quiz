import { useAuth } from "@/context/auth";
import { useEffect, useRef } from "react";
import ModalComponent from "./modal";

export default function NameEditModal({
  show,
  setShow,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
}) {
  const { user } = useAuth();
  const mounted = useRef<boolean>(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      setTimeout(() => {
        setShow(true);
      });
    }
  }, [show, setShow]);

  if (!user) return null;
  const formParams = {
    "entry.364995045": user.email ?? "",
    "entry.1751397710": "คำนำหน้า ชื่อ หรือนามสกุล ไม่ถูกต้อง",
  };

  const FORM_URL = `${
    process.env.NEXT_PUBLIC_ISSUE_FORM_URL
  }&${new URLSearchParams(formParams).toString()}`;

  return (
    <ModalComponent
      size="max-w-2xl"
      title={`ส่งคำขอแก้ไขชื่อ-นามสกุลไม่ถูกต้อง`}
      show={show}
      onClose={() => setShow(false)}
      titleClass="border-b font-medium font-prompt"
    >
      <div className="px-6 py-4 font-sarabun space-y-4 text-sm md:text-base">
        <p>
          ชื่อ-นามสกุลของคุณในระบบจะถูกแสดงในเกียรติบัตรหลังทำแบบทดสอบเสร็จสิ้นแล้ว
        </p>
        <p>
          หากชื่อ-นามสกุลไม่ถูกต้อง คุณสามารถส่งคำขอแก้ไขให้ถูกต้องได้
          โดยผู้ดูแลระบบจะดำเนินการแก้ไขให้ภายใน 3 ชั่วโมง{" "}
        </p>
        <p>ต้องการส่งคำขอแก้ไขชื่อ-นามสกุลหรือไม่?</p>
        <div className="items-center justify-center flex flex-col sm:grid-cols-2 sm:grid gap-3 sm:gap-4 w-full">
          <a
            target="_blank"
            rel="noreferrer noopener"
            href={FORM_URL}
            onClick={() => setShow(false)}
            className="text-center w-full text-white rounded focus:outline-none px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200"
          >
            ส่งคำขอ
          </a>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="w-full  rounded focus:outline-none py-2 ring-gray-300 hover:bg-gray-400 text-black bg-gray-300 disabled:bg-gray-200"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </ModalComponent>
  );
}
