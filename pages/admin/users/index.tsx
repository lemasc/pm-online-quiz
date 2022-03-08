import { ExamLevel, GenericExamModel } from "@/types/exam";
import { NextPage } from "next";
import { useCollection } from "swr-firestore-v9";
import Link from "next/link";
import UserManager from "@/components/users/manager";
import { UserMetadata } from "@/context/auth";

const Page: NextPage = () => {
  const { data } = useCollection<UserMetadata>("/users", {
    listen: true,
    orderBy: "name",
  });
  return (
    <UserManager type="User">
      <div className="flex flex-1 flex-col gap-4 overflow-auto">
        <div className="overflow-y-auto flex-1 px-4 py-6 space-y-6">
          <h2 className="text-3xl font-bold">Users</h2>
          <div className="flex flex-row flex-wrap gap-4 font-sarabun">
            {data &&
              data.map((d) => (
                <Link key={d.id} href={`/admin/users/view/${d.id}`}>
                  <a
                    className="flex flex-col rounded border bg-white hover:shadow"
                    style={{ width: "20rem" }}
                  >
                    <div className="p-6 gap-1 flex flex-col w-full text-left">
                      <b className="pb-1">
                        {d.nameTitle}
                        {d.name}
                      </b>
                      <span className="text-sm text-gray-500">
                        ระดับชั้น ม.{d.class}/{d.level}
                      </span>
                      <span className="text-sm text-blue-500">
                        คลิกเพื่อดูผลการสอบ
                      </span>
                    </div>
                  </a>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </UserManager>
  );
};

export default Page;
