import { useAuth } from "@/context/auth";
import { NextPage } from "next";

const Page: NextPage = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen h-full flex flex-col items-center justify-center ">
      Verifying identity...
    </div>
  );
};

export default Page;
