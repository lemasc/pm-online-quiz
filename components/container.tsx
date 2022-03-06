import { useHistoryRouter } from "@/context/history";
import { siteName } from "@/shared/constants";
import { ChevronLeftIcon } from "@heroicons/react/outline";
import Head from "next/head";
import { ReactElement, ReactNode } from "react";
import { ToastContainer } from "react-toastify";

export function Navbar({
  title,
  children,
  backBtn,
}: {
  title: ReactNode;
  children?: ReactNode;
  backBtn?: boolean;
}) {
  const { back } = useHistoryRouter();
  return (
    <nav
      style={{ minHeight: "68px" }}
      className="z-10 flex flex-row gap-4 items-center p-4 shadow-lg bg-quiz-blue-400 text-white"
    >
      {backBtn && (
        <button className="" title={"กลับ"} onClick={() => back("/home")}>
          <ChevronLeftIcon className="h-6 w-6 flex-shrink-0" />
        </button>
      )}
      <div className="text-lg font-bold flex-grow">{title}</div>
      {children}
    </nav>
  );
}

const isReactElement = (child: ReactNode): child is ReactElement => {
  return (
    child !== null &&
    typeof child === "object" &&
    (child as any)["$$typeof"] === Symbol.for("react.element")
  );
};

export default function Container({
  title,
  scrollable = true,
  children,
}: {
  title: string;
  fullscreen?: boolean;
  scrollable?: boolean;
  children: ReactNode | ReactNode[];
}) {
  const NavbarElement =
    Array.isArray(children) &&
    children.find(
      (child) =>
        isReactElement(child) &&
        typeof child.type === "function" &&
        child.type.name === "Navbar"
    );

  return (
    <div className="flex flex-col h-screen overflow-hidden font-prompt">
      <Head>
        <title>
          {title} : {siteName}
        </title>
      </Head>
      {NavbarElement}
      {/**
       * Container
       * - Plain Background (bg-white)
       * - Gray Background (bg-gray-100)
       */}
      <main
        className={`flex flex-grow h-full flex-col ${
          scrollable ? "overflow-auto" : "overflow-hidden"
        } flex-1 bg-gray-50`}
      >
        {Array.isArray(children)
          ? children.filter((elem) => elem !== NavbarElement)
          : children}
        {scrollable && (
          <footer className="text-sm border-t p-7 px-4 md:px-7 flex flex-row flex-wrap gap-6 text-gray-600">
            <div className="flex flex-col gap-3 md:gap-1.5 flex-grow">
              <span>
                สงวนลิขสิทธิ์ &copy; 2564-{new Date().getFullYear() + 543}{" "}
                คณะกรรมการนักเรียน โรงเรียนมัธยมสาธิตวัดพระศรีมหาธาตุ
              </span>
              <div className="flex flex-row flex-wrap gap-2 md:gap-6">
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
            </div>

            <span className="pb-2">Producted By Lemasc</span>
          </footer>
        )}
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export function NoMenuContainer({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  return (
    <div className="flex flex-col min-h-screen h-full items-center justify-center">
      {children}
    </div>
  );
}
