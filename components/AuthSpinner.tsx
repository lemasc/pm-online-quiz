import { useAuth } from "@/context/auth";
import { Transition } from "@headlessui/react";
import { ThreeDots } from "react-loader-spinner";

export default function AuthSpinner(): JSX.Element {
  const { ready } = useAuth();
  return (
    <Transition
      show={!ready}
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opactity-100"
      leaveTo="opacity-0"
      className="fixed z-20 inset-0 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="opacity-75">
          <ThreeDots color="#FFFFFF" height={80} width={80} />
        </div>
      </div>
    </Transition>
  );
}
