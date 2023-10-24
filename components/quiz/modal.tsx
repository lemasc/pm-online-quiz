import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useExamQuery } from "@/shared/exam";
import { minifiedFields } from "@/shared/firebase";
import { GenericExamModel } from "@/types/exam";
import { nanoid } from "nanoid";
import { Document, setDoc } from "swr-firestore-v9";
const ModalComponent = dynamic(() => import("@/components/modal"));

export interface ModalConfig {
  show: boolean;
  data?: Document<Partial<GenericExamModel>>;
  path?: string;
  type?: "Exam" | "Section";
}
interface ModalProps {
  config: ModalConfig;
  onClose: () => void;
  defaultType: "Exam" | "Section";
}

const defaultValues: Partial<GenericExamModel> = {
  name: "",
  allowRandom: false,
};

export default function ExamModal({
  config,
  onClose,
  defaultType,
}: ModalProps): JSX.Element {
  const { handleSubmit, register, reset, setValue, watch } = useForm<
    Partial<GenericExamModel>
  >({
    defaultValues,
  });

  const { constructPath } = useExamQuery();

  const allowRandom = watch("allowRandom");
  const canShowName = watch("canShowName");

  useEffect(() => {
    if (config.data && config.show) {
      reset(minifiedFields(config.data));
    }
  }, [config.data, reset, config.show]);

  async function onSubmit(data: Partial<GenericExamModel>) {
    const dataWithItems: Partial<GenericExamModel> = {
      ...data,
      content: config.data?.content,
      items: config.data?.items,
      canShowName: type === "Section" ? !!data?.canShowName : undefined,
    };
    const formData = Object.fromEntries(
      Object.entries(dataWithItems).filter(
        ([key, value]) =>
          value !== "" &&
          !(key === "time" && isNaN(value as number)) &&
          value !== undefined
      )
    );
    try {
      setDoc(
        `/exam-demo/${constructPath(
          config.path,
          config.data ? undefined : nanoid()
        )}`,
        formData
      );
    } catch (err) {
      console.error(err);
    }

    onClose();
  }
  function cancel() {
    onClose();
  }
  const type = config.type ?? defaultType;
  return (
    <ModalComponent
      size="max-w-2xl"
      title={`${
        config.data !== undefined ? "Edit" : "Add"
      } ${type.toLowerCase()}`}
      show={config.show}
      onClose={() => onClose()}
      titleClass="border-b font-medium"
      onLeave={() => {
        reset(defaultValues);
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
        <div className="form-container font-sarabun">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            className="input"
            placeholder={`${type} name (Required)`}
            {...register("name", {
              required: true,
            })}
          />

          {type === "Exam" ? (
            <>
              <label htmlFor="name">Subject:</label>
              <input
                type="text"
                className="input"
                placeholder={`${type} subject (Required)`}
                {...register("subject", {
                  required: true,
                })}
              />
              <label htmlFor="level">Level:</label>
              <select
                className="input"
                {...register("level", {
                  required: true,
                })}
              >
                <option value="SECONDARY">มัธยมศึกษา</option>
                <option value="UPPER_SECONDARY">มัธยมศึกษาตอนปลาย</option>
              </select>

              <label htmlFor="name" className="mr-4">
                Time Limit (Minutes):
              </label>
              <input
                placeholder="Leave blank means no time limit."
                type="number"
                className="input"
                {...register("time", {
                  valueAsNumber: true,
                })}
              />
            </>
          ) : (
            <>
              <label htmlFor="name">Can show name:</label>
              <span className="flex justify-center sm:block">
                <input
                  checked={canShowName}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50 mt-1"
                  onChange={(e) =>
                    setValue(
                      "canShowName",
                      (e.target as HTMLInputElement).checked
                    )
                  }
                />
              </span>
            </>
          )}

          <label htmlFor="name">Allow Random:</label>
          <span className="flex justify-center sm:block">
            <input
              checked={allowRandom}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50 mt-1"
              onChange={(e) =>
                setValue("allowRandom", (e.target as HTMLInputElement).checked)
              }
            />
          </span>
        </div>
        <div className="w-full flex flex-grow items-center justify-center sm:pt-4">
          <div className="items-center justify-center flex flex-col sm:grid-cols-2 sm:grid gap-3 sm:gap-4 w-full">
            <button
              type="submit"
              className="w-full text-white rounded focus:outline-none px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200"
            >
              Save
            </button>
            <button
              onClick={() => cancel()}
              type="button"
              className="w-full  rounded focus:outline-none py-2 ring-gray-300 hover:bg-gray-400 text-black bg-gray-300 disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </ModalComponent>
  );
}
