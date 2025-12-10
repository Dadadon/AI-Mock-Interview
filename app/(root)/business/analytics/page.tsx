// app/(root)/business/analytics/page.tsx (NEW FILE)
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getAnalyticsData } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";

const AnalyticsDashboard = async () => {
    const user = await getCurrentUser();
    
    // RBAC: Redirect if not a business user
    if (user?.role !== 'business' && user?.role !== 'admin') redirect("/");

    // Dummy companyId; replace with actual user.companyId lookup
    const companyId = "jm-local-business-id"; 
    const analyticsData = await getAnalyticsData(companyId);

    return (
        <main className="space-y-10">
            <h1 className="text-4xl font-bold">Business Analytics Dashboard</h1>

            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card dark-gradient p-6 rounded-2xl">
                    <h3 className="text-light-400">Average Interview Score</h3>
                    <p className="text-4xl font-extrabold text-primary-200 mt-2">
                        {analyticsData.averageScore}/100
                    </p>
                </div>
                <div className="card dark-gradient p-6 rounded-2xl">
                    <h3 className="text-light-400">Total Mock Interviews</h3>
                    <p className="text-4xl font-extrabold text-primary-200 mt-2">
                        {analyticsData.totalInterviews}
                    </p>
                </div>
                <div className="card dark-gradient p-6 rounded-2xl">
                    <h3 className="text-light-400">Local Focus: Skill Gaps</h3>
                    <p className="text-xl font-extrabold text-primary-200 mt-2">
                        {analyticsData.topSkillGaps[0]?.area || "N/A"}
                    </p>
                </div>
            </div>

            {/* Skill Gap Analysis Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Top Candidate Skill Gaps (Local Intelligence)</h2>
                <div className="card dark-gradient p-6 rounded-2xl">
                    <p className="text-light-400 mb-4">
                        These are the most common areas for improvement identified by the AI in local candidate interviews.
                    </p>
                    <ul className="space-y-2">
                        {analyticsData.topSkillGaps.map((item, index) => (
                            <li key={item.area} className="flex justify-between items-center text-lg text-light-100">
                                <span>{index + 1}. {item.area}</span>
                                <span className="text-primary-200 font-bold">{item.count} mentions</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
};

export default AnalyticsDashboard;