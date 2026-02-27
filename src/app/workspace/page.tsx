import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkspaceClient from "@/components/WorkspaceClient";

export default async function WorkspacePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id:true, name:true, email:true, role:true, apiCallsUsed:true, apiCallsLimit:true, playbookData:{select:{data:true}} },
  });
  return <WorkspaceClient user={{ id:user!.id, name:user!.name||"User", email:user!.email, role:user!.role, apiCallsUsed:user!.apiCallsUsed, apiCallsLimit:user!.apiCallsLimit }} savedData={user!.playbookData?.data as any||null} />;
}
