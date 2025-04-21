"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  addToast,
  Pagination,
  Autocomplete,
  Button,
  Image,
  Tooltip,
} from "@heroui/react";
import Sidebar from "@/components/sidebar_admin";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function ArchivedClassesPage() {
  // State to determine if the device is mobile (width < 1024px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [classesData, setClassesData] = useState([]);
  const [classesPage, setClassesPage] = useState(1);
  const itemsPerPage = 6;
  const [searchTerm, setSearchTerm] = useState("");
  // Checkbox for upcoming vs. archived classes.
  const [showArchived, setShowArchived] = useState(false);
  // New time-of-day filters; default all checked.
  const [filterMorning, setFilterMorning] = useState(true);
  const [filterAfternoon, setFilterAfternoon] = useState(true);
  const [filterEvening, setFilterEvening] = useState(true);

  // Fetch all show_classes records when the page mounts.
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE}/api/show_classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        setClassesData(data);
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
        addToast({
          title: "Error",
          description: "Error fetching classes",
          color: "danger",
        });
      });
  }, []);

  // Filter classes based on:
  // 1. The schedule_time from the show_classes record.
  // 2. The archived toggle.
  // 3. The search term (looking into class_data fields).
  // 4. The time-of-day checkboxes.
  const filteredClasses = classesData.filter((classItem) => {
    // Use schedule_time from show_classes record.
    const classTime = new Date(classItem.schedule_time);
    const now = new Date();
    // If "See Archived Classes" is checked, include only those in the past; otherwise future/current.
    const timeFilter = showArchived ? classTime < now : classTime >= now;

    // Time-of-day filter.
    const hour = classTime.getHours();
    let timeOfDayMatch = false;
    if (filterMorning && hour >= 4 && hour < 11) timeOfDayMatch = true;
    if (filterAfternoon && hour >= 11 && hour < 17) timeOfDayMatch = true;
    if (filterEvening && hour >= 17 && hour < 21) timeOfDayMatch = true;

    // Search filter inside the joined class_data.
    let searchMatch = true;
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      searchMatch =
        classItem.class_data?.name?.toLowerCase().includes(lowerSearch) ||
        classItem.class_data?.difficulty?.toLowerCase().includes(lowerSearch) ||
        classItem.class_data?.duration?.toLowerCase().includes(lowerSearch);
    }

    return timeFilter && timeOfDayMatch && searchMatch;
  });

  // Sort filtered classes by schedule_time in ascending order.
  const sortedFilteredClasses = filteredClasses.sort(
    (a, b) =>
      new Date(a.schedule_time).getTime() - new Date(b.schedule_time).getTime()
  );

  // Pagination.
  const paginatedClasses = sortedFilteredClasses.slice(
    (classesPage - 1) * itemsPerPage,
    classesPage * itemsPerPage
  );

  return (
    <>
      <Sidebar />
      <div
        className={`flex-1 p-5 transition-all duration-300 ${
          !isMobile ? "ml-72" : ""
        }`}
      >
        <h1 className="text-2xl font-bold">Scheduled Classes</h1>
        <p className="text-gray-600 mt-2">
          {showArchived ? "Archived Classes" : "Upcoming Classes"}
        </p>

        {/* Top controls: search bar, archived checkbox, and time-of-day filters */}
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Autocomplete
              allowsCustomValue
              label="Search Classes"
              variant="bordered"
              placeholder="Search classes..."
              className="w-full sm:max-w-xs"
              onInputChange={(value) => {
                setSearchTerm(value);
                setClassesPage(1);
              }}
              items={[]}
            >
              <></>
            </Autocomplete>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => {
                  setShowArchived(e.target.checked);
                  setClassesPage(1);
                }}
              />
              <span>See Archived Classes</span>
            </label>
          </div>
          {/* Time-of-day filter checkboxes */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filterMorning}
                onChange={(e) => setFilterMorning(e.target.checked)}
              />
              <span>Morning (4AM - 10AM)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filterAfternoon}
                onChange={(e) => setFilterAfternoon(e.target.checked)}
              />
              <span>Afternoon (11AM - 4PM)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filterEvening}
                onChange={(e) => setFilterEvening(e.target.checked)}
              />
              <span>Evening (5PM - 8PM)</span>
            </label>
          </div>
        </div>

        {/* Classes Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px] mt-4">
          {paginatedClasses.map((classItem) => {
            // Extract class_data for display; schedule_time comes from show_classes record.
            const cd = classItem.class_data || {};

            return (
              <Card key={classItem.id} className="mt-4">
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
                  <div className="relative w-full">
                    {cd.class_type?.image && (
                      <div className="w-full flex justify-center">
                        <div className="w-[200px] h-[120px] overflow-hidden rounded-xl">
                          <Image
                            alt="Class Type"
                            src={`${API_BASE}${cd.class_type.image}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-center">
                      <h4 className="font-bold text-large">
                        {cd.class_type?.name || "No Class Type"}
                      </h4>
                      <p className="text-sm text-tiny uppercase font-bold">
                        {cd.name || "Unnamed Class"}
                      </p>
                      <small className="text-default-500">
                        Schedule:{" "}
                        {new Date(classItem.schedule_time).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" }
                        )}
                        <br />
                        {new Date(classItem.schedule_time).toLocaleTimeString(
                          "en-US",
                          {
                            weekday: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}
                      </small>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="overflow-visible py-2 flex flex-col">
                  <div className="mt-auto">
                    <p>Difficulty: {cd.difficulty}</p>
                    <p>Duration: {cd.duration}</p>
                    <p>Max Participants: {cd.max_participants}</p>
                    <p>Trainer: {cd.trainer.id}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4">
          <Pagination
            color="default"
            total={Math.ceil(filteredClasses.length / itemsPerPage)}
            initialPage={classesPage}
            onChange={setClassesPage}
          />
        </div>
      </div>
    </>
  );
}
