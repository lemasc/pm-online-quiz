import { NoMenuContainer as Container } from "@/components/container";
import { useAuth, UserMetadata } from "@/context/auth";
import { siteName } from "@/shared/constants";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import GoogleButton from "react-google-button";
import landing from "../../public/web.jpeg";

import { toast } from "react-toastify";
import { useEffect } from "react";
import { setDoc } from "swr-firestore-v9";

const Home: NextPage = () => {
  const { replace } = useRouter();
  const { signInWithGoogle, user, metadata } = useAuth();
  useEffect(() => {
    if (user && metadata && !metadata.exists) {
      // OK OK Set mock data
      const data: UserMetadata = {
        class: 6,
        level: 1,
        name: user.displayName as string,
        nameTitle: "",
        studentId: 99999,
        studentNo: 50,
      };
      setDoc(`/users/${user.uid}`, data)
        ?.then(() => {
          replace("/home");
        })
        .catch(() =>
          alert(
            "ไม่สามารถเข้าสู่ระบบในนามอาจารย์ได้ กรุณาติดต่อกรรมการนักเรียน"
          )
        );
    }
  }, [user, metadata, replace]);
  return (
    <Container>
      <Head>
        <title>เข้าสู่ระบบ (อาจารย์) : {siteName}</title>
      </Head>
      <div className="flex flex-col lg:flex-row h-screen w-full bg-[#e7965b]">
        <div className="lg:relative flex flex-col items-center justify-center flex-grow lg:p-4">
          <div className="max-w-[100vh]">
            <Image src={landing} className="z-1" alt="Landing" />
          </div>
          <div className="hidden lg:block mx-8 text-center font-sarabun text-black absolute bottom-5 text-sm">
            สงวนลิขสิทธิ์ &copy; 2564-2565 คณะกรรมการนักเรียน
            โรงเรียนมัธยมสาธิตวัดพระศรีมหาธาตุ มหาวิทยาลัยราชภัฏพระนคร
          </div>
        </div>
        <div className="bg-white rounded-t-xl lg:rounded-t-none lg:rounded-l-xl shadow flex flex-col gap-8 text-center items-center justify-center font-prompt px-10 py-8">
          <h1 className="text-3xl font-bold pt-4">{siteName}</h1>
          <div className="flex flex-col gap-4 items-center justify-center">
            <span className="text-red-600">
              เฉพาะอาจารย์เท่านั้น ใช้อีเมลโรงเรียน (PNRU)
            </span>

            <GoogleButton
              onClick={async () => {
                try {
                  await signInWithGoogle(true);
                } catch (err) {
                  toast.error("ไม่สามารถเข้าสู่ระบบได้");
                }
              }}
            />
          </div>
          <div className="flex flex-row flex-wrap gap-2 lg:gap-6 text-sm justify-center">
            <a href="#" className="underline">
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
