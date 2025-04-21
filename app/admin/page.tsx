"use client";

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/sidebar_admin";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2"; // Import Line chart component
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement, // Import the PointElement for line charts
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  getKeyValue,
} from "@heroui/react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement, // Register the point element here
  Title,
  Tooltip,
  Legend
);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);

  // Metrics
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [trainers, setTrainers] = useState(0);
  const [expiredAccounts, setExpiredAccounts] = useState(0);
  const [noSubscription, setNoSubscription] = useState(0);
  const [nonSubscribedUsers, setNonSubscribedUsers] = useState<any[]>([]);

  // Chart data for subscriptions (dynamic datasets by plan)
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [] as any[],
  });

  // Revenue chart data (monthly revenue only)
  const [revChartData, setRevChartData] = useState({
    labels: [] as string[],
    datasets: [] as any[],
  });

  // Pie chart data for class registrations by class type
  const [classTypePieChartData, setClassTypePieChartData] = useState({
    labels: [] as string[],
    datasets: [] as any[],
  });

  // Selected year (default to current year)
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Months for display and filtering
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Pagination state for non-subscribed users table
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // State for class registrations (fetched from API)
  const [classRegistrations, setClassRegistrations] = useState<any[]>([]);
  // Dropdown state: choose a month ("all" aggregates the whole year)
  const [selectedMonthForClass, setSelectedMonthForClass] =
    useState<string>("all");

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch metrics (users and memberships)
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem("token");
        const usersResponse = await axios.get(`${API_BASE}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });
        if (Array.isArray(usersResponse.data)) {
          const members = usersResponse.data.filter(
            (user: any) => user.role === "member"
          );
          const trainersFromUsers = usersResponse.data.filter(
            (user: any) => user.role === "trainer"
          );
          setTotalUsers(members.length);
          setTrainers(trainersFromUsers.length);
        } else {
          setTotalUsers(0);
          setTrainers(0);
        }
        const activeMembershipResponse = await axios.get(
          `${API_BASE}/api/memberships/active`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );
        setActiveUsers(
          Array.isArray(activeMembershipResponse.data)
            ? activeMembershipResponse.data.length
            : 0
        );
        const expiredResponse = await axios.get(
          `${API_BASE}/api/expired-memberships`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );
        setExpiredAccounts(
          Array.isArray((expiredResponse.data as { data: any[] }).data)
            ? (expiredResponse.data as { data: any[] }).data.length
            : 0
        );
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };
    fetchMetrics();
  }, []);

  // Fetch accounts without subscription
  useEffect(() => {
    const fetchNonSubscribedUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const usersResponse = await axios.get(`${API_BASE}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });
        const members = Array.isArray(usersResponse.data)
          ? usersResponse.data.filter((user: any) => user.role === "member")
          : [];
        const activeResponse = await axios.get(
          `${API_BASE}/api/memberships/active`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        const expiredResponse = await axios.get(
          `${API_BASE}/api/expired-memberships`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        const activeMemberships = Array.isArray(activeResponse.data)
          ? activeResponse.data
          : [];
        const expiredMemberships = Array.isArray(
          (expiredResponse.data as { data: any[] }).data
        )
          ? (expiredResponse.data as { data: any[] }).data
          : [];
        const allMemberships = [...activeMemberships, ...expiredMemberships];
        const membershipUserIds = new Set(
          allMemberships.map((m: any) => m.user_id)
        );
        const nonSubscribed = members.filter(
          (user: any) => !membershipUserIds.has(user.id)
        );
        setNonSubscribedUsers(nonSubscribed);
      } catch (error) {
        console.error("Error fetching non-subscribed accounts:", error);
      }
    };
    fetchNonSubscribedUsers();
  }, [totalUsers]);

  // Compute paginated items for non-subscribed users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return nonSubscribedUsers.slice(start, end);
  }, [page, nonSubscribedUsers]);

  const totalPages = Math.ceil(nonSubscribedUsers.length / rowsPerPage);

  // Fetch subscriptions chart data (by membership start_date)
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem("token");
        const activeResponse = await axios.get(
          `${API_BASE}/api/memberships/active`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );
        const activeMemberships = Array.isArray(activeResponse.data)
          ? activeResponse.data
          : [];
        const expiredResponse = await axios.get(
          `${API_BASE}/api/expired-memberships`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );
        const expiredMemberships = Array.isArray(
          (expiredResponse.data as { data: any[] }).data
        )
          ? (expiredResponse.data as { data: any[] }).data
          : [];
        const allMemberships = [...activeMemberships, ...expiredMemberships];
        const filteredMemberships = allMemberships.filter((membership: any) => {
          const subDate = new Date(membership.start_date.replace(" ", "T"));
          return subDate.getFullYear() === selectedYear;
        });
        const planData: Record<string, number[]> = {};
        filteredMemberships.forEach((membership: any) => {
          const subDate = new Date(membership.start_date.replace(" ", "T"));
          const plan = membership.subscription.plan_name;
          const monthIndex = subDate.getMonth();
          if (!planData[plan]) {
            planData[plan] = Array(12).fill(0);
          }
          planData[plan][monthIndex] += 1;
        });
        const planColors = [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(255, 206, 86)",
          "rgb(75, 192, 192)",
          "rgb(153, 102, 255)",
          "rgb(255, 159, 64)",
          "rgb(199, 199, 199)",
          "rgb(83, 102, 255)",
          "rgb(255, 102, 255)",
          "rgb(102, 255, 102)",
        ];
        const datasets = Object.keys(planData).map((plan, index) => ({
          label: plan,
          data: planData[plan],
          backgroundColor: planColors[index % planColors.length],
        }));
        setChartData({
          labels: months,
          datasets: datasets,
        });
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };
    fetchChartData();
  }, [selectedYear]);

  // Fetch class registration data using the new endpoint
  useEffect(() => {
    const fetchClassRegistrationData = async () => {
      try {
        const token = localStorage.getItem("token");
        const registrationResponse = await axios.get(
          `${API_BASE}/api/class-registration`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );
        // Debug: inspect raw response
        console.log(
          "🔍 class-registration raw response:",
          registrationResponse.data
        );

        // Normalize: handle both { data: [...] } and [...] shapes
        const regs = Array.isArray(registrationResponse.data)
          ? registrationResponse.data
          : Array.isArray((registrationResponse.data as { data: any[] }).data)
            ? (registrationResponse.data as { data: any[] }).data
            : [];

        setClassRegistrations(regs);
      } catch (error) {
        console.error("Error fetching class registration data:", error);
      }
    };
    fetchClassRegistrationData();
  }, []);

  // Update pie chart data for class registrations grouped by class type (using class_type name)
  useEffect(() => {
    // Use show_class.schedule_time for filtering; adjust as needed.
    const filteredRegs = classRegistrations.filter((reg: any) => {
      const scheduleTime = reg.show_class?.schedule_time;
      if (!scheduleTime) return false;
      const regDate = new Date(scheduleTime.replace(" ", "T"));
      const isYearMatch = regDate.getFullYear() === selectedYear;
      if (selectedMonthForClass === "all") return isYearMatch;
      const isMonthMatch =
        regDate.getMonth() === parseInt(selectedMonthForClass, 10);
      return isYearMatch && isMonthMatch;
    });
    // Aggregate counts by the real class type name.
    // Expected nested path: reg.show_class?.class_data?.class_type?.name
    const classCounts: Record<string, number> = {};
    filteredRegs.forEach((reg: any) => {
      const classTypeName =
        reg.show_class?.class_data?.class_type?.name || "Unknown";
      classCounts[classTypeName] = (classCounts[classTypeName] || 0) + 1;
    });
    const labels = Object.keys(classCounts);
    const data = Object.values(classCounts);
    const colorPalette = [
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 206, 86)",
      "rgb(75, 192, 192)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
      "rgb(199, 199, 199)",
      "rgb(83, 102, 255)",
      "rgb(255, 102, 255)",
      "rgb(102, 255, 102)",
    ];
    const colors = labels.map(
      (_, index) => colorPalette[index % colorPalette.length]
    );
    setClassTypePieChartData({
      labels: labels,
      datasets: [
        {
          label: "Registrations by Class Type",
          data: data,
          backgroundColor: colors,
        },
      ],
    });
  }, [classRegistrations, selectedMonthForClass, selectedYear]);

  // Define the pie chart config using a configuration object.
  const pieConfig = {
    type: "pie",
    data: classTypePieChartData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" as const },
        title: { display: true, text: "Registrations by Class Type" },
      },
    },
  };

  // New: Fetch and update monthly revenue data from the payments endpoint
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const token = localStorage.getItem("token");
        // Use the "all" argument so that the show method returns all payments.
        const response = await axios.get(`${API_BASE}/api/payments/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });
        const payments = Array.isArray(response.data) ? response.data : [];
        const monthlyRevenue = Array(12).fill(0);
        payments.forEach((payment: any) => {
          // Prefer to use created_at or fallback to transaction_date if needed.
          const createdAt = payment.created_at || payment.transaction_date;
          if (!createdAt) return;
          const date = new Date(createdAt.replace(" ", "T"));
          if (date.getFullYear() === selectedYear) {
            const month = date.getMonth(); // 0-indexed, so Jan = 0
            monthlyRevenue[month] += Number(payment.amount);
          }
        });
        setRevChartData({
          labels: months,
          datasets: [
            {
              label: "Monthly Revenue",
              data: monthlyRevenue,
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };
    fetchRevenueData();
  }, [selectedYear]);

  // Chart options for subscriptions chart
  const optionsChart = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: `User Subscriptions by Month (${selectedYear})`,
      },
    },
  };

  // Chart options for revenue chart (line chart)
  const revOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: `Monthly Revenue (${selectedYear})` },
    },
  };

  return (
    <div className="flex overflow-x-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Content Area */}
      <div
        className={`flex-1 p-5 transition-all duration-300 ${!isMobile ? "ml-72" : ""}`}
      >
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and view analytics here.
        </p>

        {/* Year Selector */}
        <div className="mt-4">
          <label htmlFor="yearSelect" className="mr-2 font-semibold">
            Select Year:
          </label>
          <select
            id="yearSelect"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded p-1"
          >
            <option value={new Date().getFullYear()}>
              {new Date().getFullYear()}
            </option>
            <option value={new Date().getFullYear() - 1}>
              {new Date().getFullYear() - 1}
            </option>
            <option value={new Date().getFullYear() - 2}>
              {new Date().getFullYear() - 2}
            </option>
          </select>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Total Users</h2>
            <p className="text-3xl mt-2">{totalUsers}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Active Users</h2>
            <p className="text-3xl mt-2">{activeUsers}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Expired Accounts</h2>
            <p className="text-3xl mt-2">{expiredAccounts}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Trainers</h2>
            <p className="text-3xl mt-2">{trainers}</p>
          </div>
        </div>

        {/* Additional Row: Non-Subscribed Users Table & Class Types Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Non-Subscribed Users Table */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">
              Accounts Without Subscription
            </h2>
            {nonSubscribedUsers.length === 0 ? (
              <p className="mt-2">No accounts found.</p>
            ) : (
              <Table
                isStriped
                aria-label="Non-Subscribed Users Table"
                bottomContent={
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="secondary"
                      page={page}
                      total={totalPages}
                      onChange={(page) => setPage(page)}
                    />
                  </div>
                }
                classNames={{ wrapper: "min-h-[222px]" }}
              >
                <TableHeader>
                  <TableColumn key="name">NAME</TableColumn>
                  <TableColumn key="gender">GENDER</TableColumn>
                  <TableColumn key="contact_number">CONTACT NUMBER</TableColumn>
                </TableHeader>
                <TableBody items={paginatedUsers}>
                  {(item) => (
                    <TableRow key={item.id}>
                      {(columnKey) => (
                        <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          {/* Class Types Pie Chart Card */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">
              Class Registrations by Class Type
            </h2>
            <div className="mt-2">
              <label htmlFor="classMonthSelect" className="mr-2 font-semibold">
                Select Month:
              </label>
              <select
                id="classMonthSelect"
                value={selectedMonthForClass}
                onChange={(e) => setSelectedMonthForClass(e.target.value)}
                className="border rounded p-1"
              >
                <option value="all">All</option>
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <Pie {...pieConfig} />
            </div>
          </div>
        </div>

        {/* Subscriptions Bar Chart */}
        <div className="bg-white shadow rounded p-4 mt-6">
          <Bar data={chartData} options={optionsChart} />
        </div>

        {/* Monthly Revenue Line Chart */}
        <div className="bg-white shadow rounded p-4 mt-6">
          <h2 className="text-lg font-semibold">Monthly Revenue</h2>
          <Line data={revChartData} options={revOptions} />
        </div>
      </div>
    </div>
  );
}
