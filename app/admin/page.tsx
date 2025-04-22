import Sidebar from "@/components/sidebar_admin";

export default function Dashboard() {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 p-5">
                <h1 className="text-2xl font-bold">Admin</h1>
                <p className="text-gray-600 mt-2">Manage your account here.</p>
            </div>
        </div>
    );
}
