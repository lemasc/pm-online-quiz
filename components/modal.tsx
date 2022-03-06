import { Fragment, ReactNode, useRef } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";

type ModalComponentProps = {
  show: boolean;
  size: string;
  onClose?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  children: ReactNode;
  title: string;
  titleClass?: string;
  description?: string;
  descriptionClass?: string;
};

export default function ModalComponent({
  show,
  size,
  children,
  onEnter,
  onLeave,
  onClose,
  title,
  titleClass,
  description,
  descriptionClass,
}: ModalComponentProps): JSX.Element {
  const closeRef = useRef<HTMLButtonElement>(null);
  return (
    <Transition show={show} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-y-auto z-20"
        onClose={() => onClose && onClose()}
        initialFocus={closeRef}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-400 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            afterLeave={onLeave}
            beforeEnter={onEnter}
          >
            <div
              className={
                size +
                " inline-block w-full my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
              }
            >
              <Dialog.Title
                as="h3"
                className={
                  "flex flex-row px-6 py-4 text-lg leading-6 " + titleClass
                }
              >
                <div className="flex flex-grow">{title}</div>
                <button
                  title="ปิด"
                  className={
                    "focus:outline-none text-gray-500" +
                    (!onClose ? " hidden" : "")
                  }
                  onClick={() => onClose && onClose()}
                  ref={closeRef}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </Dialog.Title>
              {description && (
                <Dialog.Description className={"px-6 py-3 " + descriptionClass}>
                  {description}
                </Dialog.Description>
              )}
              {children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
