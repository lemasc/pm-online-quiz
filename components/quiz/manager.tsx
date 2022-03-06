import ExamModal, { ModalConfig } from "@/components/quiz/modal";
import { useHistoryRouter } from "@/context/history";
import { useExamQuery } from "@/shared/exam";
import { Menu, Transition } from "@headlessui/react";
import {
  ArchiveIcon,
  ChevronLeftIcon,
  ClipboardListIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import Head from "next/head";
import { useRouter } from "next/router";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import { deleteDoc } from "swr-firestore-v9";

type ChildrenProps = {
  removeItem: (path?: string, type?: string) => void;
  setModal: Dispatch<SetStateAction<ModalConfig>>;
};

export function Buttons({
  className,
  onEdit,
  onDelete,
}: {
  className?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex flex-row ${className}`}>
      <button
        title="Edit"
        className="rounded-full outline-gray-400 hover:bg-gray-100 text-gray-600 hover:text-black p-3"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        title="Remove"
        className="rounded-full outline-red-500 hover:bg-red-500 text-red-600 hover:text-gray-100 p-3"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function AddMenu({
  addSection,
  addItems,
}: {
  addSection: () => void;
  addItems: () => void;
}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md  focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <PlusIcon
            className="w-5 h-5 -ml-1 mr-2 text-violet-200 hover:text-violet-100"
            aria-hidden="true"
          />
          Add
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 w-56 mt-1 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1 ">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-blue-500 text-white" : "text-gray-900"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  onClick={() => addSection()}
                >
                  <ArchiveIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  Section
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-blue-500 text-white" : "text-gray-900"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  onClick={() => addItems()}
                >
                  <ClipboardListIcon
                    className="w-5 h-5 mr-2"
                    aria-hidden="true"
                  />
                  Items
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export default function QuizManager({
  head,
  type,
  children,
}: {
  type: "Exam" | "Section";
  children: (props: ChildrenProps) => JSX.Element | JSX.Element[];
  head?: string;
}) {
  const { back } = useHistoryRouter();
  const { push, query } = useRouter();
  const [modal, setModal] = useState<ModalConfig>({ show: false });
  const { constructPath } = useExamQuery();

  const removeItem = (path?: string, typeString?: string) => {
    if (!typeString) typeString = type.toLowerCase();
    if (!confirm(`Are you sure you want to delete this ${typeString}?`)) return;
    deleteDoc(`/exam/${constructPath(path)}`);
  };

  const addSection = () => {
    setModal({ show: true, type: "Section", path: "sections" });
  };

  const addItems = () => {
    if (!Array.isArray(query.path)) return;
    push(`/admin/exam/edit/${query.path.join("/")}`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Head>
        <title>{head ? `${head} : ` : ""}LQM Editor</title>
      </Head>
      <div className="flex-row p-4 border-b w-full flex items-center">
        <div className="flex flex-grow items-center gap-4">
          {type === "Section" && (
            <button
              className="flex flex-row gap-2 items-center hover:underline"
              title={"Back"}
              onClick={() =>
                back(
                  Array.isArray(query.path) && query.path.length > 1
                    ? `/admin/exam/view/${query.path.slice(0, -1).join("/")}`
                    : `/admin/exam`
                )
              }
            >
              <ChevronLeftIcon className="h-6 w-6 flex-shrink-0" />
            </button>
          )}
          <h1 className="font-bold text-lg">Editor</h1>
        </div>
        {type === "Section" ? (
          <AddMenu {...{ addSection, addItems }} />
        ) : (
          <button
            title="Add"
            onClick={() => setModal({ show: true })}
            className="inline-flex justify-center  px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md  focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
          >
            <PlusIcon
              className="w-5 h-5 -ml-1 mr-2 text-violet-200 hover:text-violet-100"
              aria-hidden="true"
            />
            Add
          </button>
        )}
      </div>

      {children({ setModal, removeItem })}
      <div className="flex flex-col border-t p-4 w-full bg-gray-100 text-sm">
        <span>Copyright &copy; 2021-2022 Lemasc QuizManager</span>
      </div>
      <ExamModal
        defaultType={type}
        config={modal}
        onClose={() => setModal((d) => ({ ...d, show: false }))}
      />
    </div>
  );
}
