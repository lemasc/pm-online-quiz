import { NoMenuContainer as Container } from "@/components/container";
import { siteName } from "@/shared/constants";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import landing from "../public/web.jpeg";

import { auth } from "@/shared/firebase";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const Home: NextPage = () => {
  const { replace } = useRouter();
  return (
    <Container>
      <Head>
        <title>เข้าสู่ระบบ : {siteName}</title>
      </Head>
      <div className="flex flex-col lg:flex-row h-screen w-full bg-[#e7965b]">
        <div className="lg:relative flex flex-col items-center justify-center flex-grow lg:p-4">
          <div className="max-w-[100vh]">
            <Image src={landing} className="z-1" alt="Landing" priority />
          </div>
          <div className="hidden lg:block mx-8 text-center font-sarabun text-black absolute bottom-5 text-sm">
            สงวนลิขสิทธิ์ &copy; 2564-2565 คณะกรรมการนักเรียน
            โรงเรียนมัธยมสาธิตวัดพระศรีมหาธาตุ มหาวิทยาลัยราชภัฏพระนคร
          </div>
        </div>
        <div className="bg-white rounded-t-xl lg:rounded-t-none lg:rounded-l-xl shadow flex flex-col gap-8 text-center items-center justify-center font-prompt px-10 py-8">
          <h1 className="text-3xl font-bold pt-4">{siteName}</h1>
          <div className="flex flex-col gap-4 items-center justify-center">
            <span>เข้าสู่ระบบด้วยบัญชีชั่วคราว</span>
            <button
              className="bg-orange-500 hover:bg-orange-600 rounded-lg px-6 py-3 text-white w-full"
              onClick={async () => {
                try {
                  await signInAnonymously(auth);
                  replace("/home");
                } catch (err) {
                  toast.error("ไม่สามารถเข้าสู่ระบบได้");
                }
              }}
            >
              เข้าสู่ระบบ
            </button>
          </div>
          <div className="flex flex-row flex-wrap gap-2 lg:gap-6 text-sm justify-center">
            <a
              href={process.env.NEXT_PUBLIC_ISSUE_FORM_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="underline"
            >
              แจ้งปัญหาการใช้งาน
            </a>
            <a href="#" className="underline">
              เงื่อนไขการใช้งาน
            </a>
            <a href="#" className="underline">
              นโยบายความเป็นส่วนตัว
            </a>
          </div>
          <div className="lg:hidden text-center font-sarabun text-black text-sm">
            สงวนลิขสิทธิ์ &copy; 2564-2565 คณะกรรมการนักเรียน
            โรงเรียนมัธยมสาธิตวัดพระศรีมหาธาตุ มหาวิทยาลัยราชภัฏพระนคร
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Home;
