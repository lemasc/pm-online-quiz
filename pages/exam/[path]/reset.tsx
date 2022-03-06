import { clearExamSession } from "@/shared/api";
import { withSession } from "@/shared/session";
import { GetServerSideProps } from "next";

/**
 * The `reset` endpoint will clear the current exam session.
 * Clients that access after will recieved `403` status.
 */
export const getServerSideProps: GetServerSideProps = withSession(
  async (ctx) => {
    const path = ctx.params?.path;
    if (typeof path === "string") {
      clearExamSession(ctx.req, path);
      await ctx.req.session.save();
      return {
        redirect: {
          destination: `/exam/${path}`,
          permanent: false,
        },
      };
    }

    return {
      redirect: {
        destination: `/`,
        permanent: false,
      },
    };
  }
);

export default function Page() {
  return <></>;
}
