import UserManager from "@/components/users/manager";
import { sessionOptions } from "@/shared/session";
import { DownloadToken } from "@/types/exam";
import { sealData } from "iron-session";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const userId = ctx.params?.path;
  const submissionId = ctx.params?.id;
  if (typeof userId !== "string" || typeof submissionId !== "string") {
    return {
      redirect: {
        destination: "/admin/users",
        permanent: false,
      },
    };
  }
  const token = await sealData<DownloadToken>(
    { userId, submissionId, admin: true },
    sessionOptions
  );
  return {
    redirect: {
      destination: `/exam/${submissionId}/printout?token=${token}`,
      permanent: false,
    },
  };
};
export default function Page() {
  return <span></span>;
}
