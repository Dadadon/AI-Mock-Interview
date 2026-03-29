import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import CreateJobForm from "./CreateJobForm";

const CreateJobPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return <CreateJobForm employerId={user.id} />;
};

export default CreateJobPage;
