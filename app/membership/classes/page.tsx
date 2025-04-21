"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_member";
import { DatePicker, Select, SelectItem } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import Image from "next/image";
import { Clock, BicepsFlexed, Hourglass, CircleUser, Info } from "lucide-react";
import ClassCheckbox from "@/components/classcheckbox";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Define interfaces reflecting the API response from show_classes.
interface Trainer {
  user?: { // optional: it might not be loaded unless eager loaded by the backend
    name: string;
  };
}

interface ClassData {
  id: number;
  name: string;
  trainer?: Trainer;
  class_type_id: number;
  description: string;
  schedule_time: string;
  difficulty: string;
  duration: string;
  max_participants: number;
  // Note: class_type is expected to be joined if available.
  class_type?: {
    id: number;
    name: string;
    image: string;
  };
}

interface ShowClassRecord {
  id: number;
  schedule_time: string; // schedule_time stored in the show_classes table
  class_data: ClassData; // joined class details
}

interface ClassType {
  id: number;
  name: string;
  image: string;
}

const difficultyOptions = ["easy", "hard", "difficult", "challenging"];
const durationOptions = ["30 mins", "45 mins", "60 mins", "90 mins"];

// Helper to format schedule time as a 12-hour time string (without seconds)
const formatTime = (schedule: string): string => {
  const parts = schedule.split(" ");
  if (parts.length < 2) return "";
  const timeParts = parts[1].split(":");
  let hour = parseInt(timeParts[0], 10);
  const minute = timeParts[1];
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour = hour - 12;
  }
  return `${hour}:${minute} ${period}`;
};

const ClassesPage: React.FC = () => {
  // Modal state for image display.
  const [modalImageSrc, setModalImageSrc] = useState<string>("");
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  // Filter states.
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(
    today(getLocalTimeZone())
  );
  const [selectedClassType, setSelectedClassType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  // Data states.
  const [classes, setClasses] = useState<ShowClassRecord[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ShowClassRecord[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);

  // Fetch show_classes records on mount (data source is now only the show_classes table).
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get<ShowClassRecord[]>(`${API_BASE}/api/show_classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      .then((response) => {
        setClasses(response.data);
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
      });
  }, []);

  // Fetch class types.
  useEffect(() => {
    axios
      .get<ClassType[] | { classTypes: ClassType[] }>(`${API_BASE}/api/class-types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => {
        const typesArray = Array.isArray(data) ? data : data.classTypes || data;
        setClassTypes(typesArray);
      })
      .catch((error) => {
        console.error("Error fetching class types:", error);
      });
  }, []);

  // Helper function to compute next 7 days.
  const getNextSevenDays = (start: CalendarDate): CalendarDate[] => {
    const days: CalendarDate[] = [];
    const startDate = new Date(start.year, start.month - 1, start.day);
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i);
      days.push(
        new CalendarDate(
          newDate.getFullYear(),
          newDate.getMonth() + 1,
          newDate.getDate()
        )
      );
    }
    return days;
  };

  // Filter records based on selected filters.
  useEffect(() => {
    let filtered = classes;
    // Filter by selected date (comparing the date part of schedule_time from show_classes).
    if (selectedDate) {
      const year = selectedDate.year;
      const month = String(selectedDate.month).padStart(2, "0");
      const day = String(selectedDate.day).padStart(2, "0");
      const selDateStr = `${year}-${month}-${day}`;
      filtered = filtered.filter((cls) => {
        const [classDate] = cls.schedule_time.split(" ");
        return classDate === selDateStr;
      });
    }
    if (selectedClassType) {
      filtered = filtered.filter(
        (cls) => String(cls.class_data.class_type_id) === selectedClassType
      );
    }
    if (selectedDifficulty) {
      filtered = filtered.filter(
        (cls) => cls.class_data.difficulty === selectedDifficulty
      );
    }
    if (selectedDuration) {
      filtered = filtered.filter(
        (cls) => cls.class_data.duration === selectedDuration
      );
    }
    setFilteredClasses(filtered);
  }, [selectedDate, selectedClassType, selectedDifficulty, selectedDuration, classes]);

  const getClassTypeName = (id: number): string => {
    const type = classTypes.find((ct) => ct.id === id);
    return type ? type.name : "Unknown";
  };

  const getClassTypeImage = (id: number): string => {
    const type = classTypes.find((ct) => ct.id === id);
    if (type && type.image) {
      return `${API_BASE}${type.image}`;
    }
    return "/placeholder.png";
  };

  const getHourFromSchedule = (schedule: string): number => {
    const parts = schedule.split(" ");
    if (parts.length < 2) return 0;
    return parseInt(parts[1].split(":")[0], 10);
  };

  const sortClassesByTime = (records: ShowClassRecord[]) => {
    return records
      .slice()
      .sort(
        (a, b) =>
          new Date(a.schedule_time).getTime() - new Date(b.schedule_time).getTime()
      );
  };

  const morningClasses = sortClassesByTime(
    filteredClasses.filter((cls) => {
      const hour = getHourFromSchedule(cls.schedule_time);
      return hour >= 4 && hour <= 10;
    })
  );
  const afternoonClasses = sortClassesByTime(
    filteredClasses.filter((cls) => {
      const hour = getHourFromSchedule(cls.schedule_time);
      return hour >= 11 && hour <= 16;
    })
  );
  const eveningClasses = sortClassesByTime(
    filteredClasses.filter((cls) => {
      const hour = getHourFromSchedule(cls.schedule_time);
      return hour >= 17 && hour <= 20;
    })
  );

  const renderClassCards = (records: ShowClassRecord[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {records.map((cls) => {
          const cd = cls.class_data || {};
          return (
            <Card key={cls.id} className="bg-white dark:bg-gray-700 shadow">
              <CardHeader className="relative h-32 flex justify-center">
                <div className="w-full h-full relative">
                  <Image
                    alt="Class Type"
                    src={getClassTypeImage(cd.class_type_id)}
                    layout="fill"
                    objectFit="cover"
                    className="cursor-pointer"
                    onClick={() => {
                      setModalImageSrc(getClassTypeImage(cd.class_type_id));
                      setIsImageModalOpen(true);
                    }}
                  />
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex justify-center">
                  <Tooltip
                    content={
                      <div className="max-w-xs whitespace-pre-wrap break-words">
                        {cd.description}
                      </div>
                    }
                  >
                    <Info className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                  </Tooltip>
                </div>
                <div className="text-center mt-2">
                  <p className="text-2xl font-bold uppercase text-gray-800 dark:text-gray-100">
                    {getClassTypeName(cd.class_type_id)}
                  </p>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    {cd.name}
                  </p>
                </div>
              </CardBody>
              <CardFooter className="relative">
                <div className="w-full flex flex-col space-y-1 text-left text-gray-700 dark:text-gray-200 font-sans">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <p className="text-sm font-medium">
                      {formatTime(cls.schedule_time)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <BicepsFlexed className="w-4 h-4 mr-1" />
                    <p className="text-sm font-medium mr-2">{cd.difficulty}</p>
                  </div>
                  <div className="flex items-center">
                    <Hourglass className="w-4 h-4 mr-1" />
                    <p className="text-sm font-medium">{cd.duration}</p>
                  </div>
                  <div className="flex items-center">
                    <CircleUser className="w-4 h-4 mr-1" />
                    <p className="text-sm font-medium">
                      {cd.trainer?.user?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2">
                  <ClassCheckbox classId={cls.id} />
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  function countClassesForDate(day: CalendarDate): number {
    const year = day.year;
    const month = String(day.month).padStart(2, "0");
    const dayOfMonth = String(day.day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayOfMonth}`;
    return classes.filter((cls) => {
      const [classDate] = cls.schedule_time.split(" ");
      return classDate === dateStr;
    }).length;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:col-span-4">
        {/* Left Filters Section */}
        <div className="flex-0.5 bg-white dark:bg-gray-800 p-4 rounded shadow space-y-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Class Filter
          </h1>
          <div>
            <label className="block text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Select a Date:
            </label>
            <DatePicker
              className="max-w-[284px]"
              label="Select Date"
              value={selectedDate}
              onChange={setSelectedDate}
              minValue={today(getLocalTimeZone())}
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Select Class Type:
            </label>
            <Select
              aria-label="Select Class Type"
              selectedKeys={selectedClassType ? [selectedClassType] : []}
              onSelectionChange={(keys) =>
                setSelectedClassType(String(Array.from(keys)[0]))
              }
              className="max-w-[284px]"
            >
              <SelectItem key="">All</SelectItem>
              {classTypes.map((ct) => (
                <SelectItem key={ct.id.toString()}>{ct.name}</SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Select Difficulty:
            </label>
            <Select
              aria-label="Select Difficulty"
              selectedKeys={selectedDifficulty ? [selectedDifficulty] : []}
              onSelectionChange={(keys) =>
                setSelectedDifficulty(String(Array.from(keys)[0]))
              }
              className="max-w-[284px]"
            >
              <SelectItem key="">All</SelectItem>
              {difficultyOptions.map((diff) => (
                <SelectItem key={diff}>{diff}</SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Select Duration:
            </label>
            <Select
              aria-label="Select Duration"
              selectedKeys={selectedDuration ? [selectedDuration] : []}
              onSelectionChange={(keys) =>
                setSelectedDuration(String(Array.from(keys)[0]))
              }
              className="max-w-[284px]"
            >
              <SelectItem key="">All</SelectItem>
              {durationOptions.map((dur) => (
                <SelectItem key={dur}>{dur}</SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Right Classes List Section */}
        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded shadow space-y-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Available Classes
          </h1>
          <div className="mt-4">
            <Select
              label="Select Date (7 days filter)"
              selectedKeys={
                selectedDate
                  ? [
                      `${selectedDate.year}-${selectedDate.month}-${selectedDate.day}`,
                    ]
                  : []
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];
                const days = getNextSevenDays(today(getLocalTimeZone()));
                const chosen = days.find(
                  (day) => `${day.year}-${day.month}-${day.day}` === selectedKey
                );
                if (chosen) {
                  setSelectedDate(chosen);
                }
              }}
              className="max-w-xs"
            >
              {getNextSevenDays(today(getLocalTimeZone())).map((day) => {
                const count = countClassesForDate(day);
                const formatted = new Date(
                  day.year,
                  day.month - 1,
                  day.day
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <SelectItem
                    key={`${day.year}-${day.month}-${day.day}`}
                    value={`${day.year}-${day.month}-${day.day}`}
                  >
                    {formatted} (
                    {count > 0
                      ? `${count} class${count > 1 ? "es" : ""}`
                      : "no classes"}
                    )
                  </SelectItem>
                );
              })}
            </Select>
          </div>
          {filteredClasses.length > 0 ? (
            <>
              <div>
                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">
                  Morning (4AM - 10AM)
                </h3>
                {morningClasses.length > 0 ? (
                  renderClassCards(morningClasses)
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No classes available in the morning.
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">
                  Afternoon (11AM - 4PM)
                </h3>
                {afternoonClasses.length > 0 ? (
                  renderClassCards(afternoonClasses)
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No classes available in the afternoon.
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">
                  Evening (5PM - 8PM)
                </h3>
                {eveningClasses.length > 0 ? (
                  renderClassCards(eveningClasses)
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No classes available in the evening.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No classes available.
            </p>
          )}
        </div>
      </div>

      {/* Modal for image display */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 cursor-pointer"
          onClick={() => setIsImageModalOpen(false)}
        >
          <Image
            alt="Class Type"
            src={modalImageSrc}
            width={500}
            height={500}
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
