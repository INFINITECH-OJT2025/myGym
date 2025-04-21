"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/sidebar_member";
import TriggerModal from "@/components/trigger_modal";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  DateClickArg,
  EventClickArg,
} from "@fullcalendar/interaction";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  addToast,
} from "@heroui/react";
import AddWorkout from "@/components/add_workout"; // Import the AddWorkout component

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Mapping for highlight colors (CSS color values)
const colorMap: Record<string, string> = {
  default: "purple",
  primary: "#007bff",
  secondary: "#6c757d",
  success: "#28a745",
  warning: "#ffc107",
  danger: "#dc3545",
};

const colors = [
  "default",
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
];

const Dashboard: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]); // For class registrations
  const [workoutPlanEvents, setWorkoutPlanEvents] = useState<any[]>([]); // For workout plans
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [selectedWorkoutPlanEvents, setSelectedWorkoutPlanEvents] = useState<
    any[]
  >([]);
  const [highlightEnabled, setHighlightEnabled] = useState<boolean>(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  // State for controlling the add workout modal
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] =
    useState<boolean>(false);

  // Refs (if needed)
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Helper function to parse a "YYYY-MM-DD" date string as a local Date object.
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Retrieve the current user id from localStorage.
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUserId(parsedUser.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Fetch class registrations and map them to FullCalendar events.
  useEffect(() => {
    if (currentUserId === null) return;
    const fetchRegistrations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in.");
          return;
        }
        const response = await fetch(`${API_BASE}/api/class-registration`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch class registrations");
        }
        const data = await response.json();
        console.log("Fetched registration data:", data);

        const calendarEvents = data
          .filter(
            (item: any) =>
              item.user_id === currentUserId &&
              item.show_class &&
              item.show_class.schedule_time &&
              item.show_class.class_data &&
              item.show_class.class_data.name
          )
          .map((item: any) => {
            const scheduleISO = item.show_class.schedule_time.replace(" ", "T");
            const eventTime = new Date(scheduleISO).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return {
              id: item.id,
              title: `${item.show_class.class_data.name} (${eventTime})`,
              start: scheduleISO,
              eventTime,
              className: item.show_class.class_data.name,
              originalColor: "",
              backgroundColor: "",
            };
          });

        calendarEvents.forEach((ev, index) => {
          const assignedColor = colorMap[colors[index % colors.length]];
          ev.originalColor = assignedColor;
          ev.backgroundColor = assignedColor;
        });

        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error fetching registrations:", error);
      }
    };
    fetchRegistrations();
  }, [currentUserId]);

  // Fetch workout plans from the API and map them to events.
  useEffect(() => {
    if (currentUserId === null) return;
    const fetchWorkoutPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in.");
          return;
        }
        const response = await fetch(`${API_BASE}/api/workout-plans`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch workout plans");
        }
        const data = await response.json();
        console.log("Fetched workout plans data:", data);

        const plans = data.map((plan: any, index: number) => {
          const scheduleISO = plan.schedule_time.replace(" ", "T");
          const eventTime = new Date(scheduleISO).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            id: plan.id,
            planName: plan.name, // <-- raw name for the modal table
            title: `${plan.name} (${eventTime})`, // <-- name + time for the calendar
            start: scheduleISO,
            eventTime,
            originalColor: colorMap[colors[index % colors.length]],
            backgroundColor: colorMap[colors[index % colors.length]],
          };
        });

        setWorkoutPlanEvents(plans);
      } catch (error) {
        console.error("Error fetching workout plans:", error);
      }
    };
    fetchWorkoutPlans();
  }, [currentUserId]);

  // Apply highlight settings for class events.
  const displayedEvents = events.map((ev) => ({
    ...ev,
    backgroundColor: highlightEnabled ? ev.originalColor : "transparent",
    textColor: highlightEnabled ? "#fff" : "#000",
    borderColor: "transparent",
  }));
  // Apply highlight settings for workout plan events.
  const displayedWorkoutPlans = workoutPlanEvents.map((wp) => ({
    ...wp,
    backgroundColor: highlightEnabled ? wp.originalColor : "transparent",
    textColor: highlightEnabled ? "#fff" : "#000",
    borderColor: "transparent",
  }));
  // Merge both events so that both classes and workout plans show on the calendar.
  const combinedEvents = [...displayedEvents, ...displayedWorkoutPlans];

  // Open modal for a specific date and filter both class and workout plan events.
  const openModalForDate = (dateStr: string) => {
    const classEventsForDate = events.filter(
      (ev) => ev.start.slice(0, 10) === dateStr
    );
    const workoutEventsForDate = workoutPlanEvents.filter(
      (plan) => plan.start.slice(0, 10) === dateStr
    );
    setSelectedDate(dateStr);
    setSelectedDateEvents(classEventsForDate);
    setSelectedWorkoutPlanEvents(workoutEventsForDate);
    setIsModalOpen(true);
  };

  // When clicking any date, open the modal.
  const handleDateClick = (arg: DateClickArg) => {
    openModalForDate(arg.dateStr);
  };

  // Allow clicking events to open the modal.
  const handleEventClick = (arg: DateClickArg | EventClickArg) => {
    const eventStart = arg.event.start;
    if (!eventStart) return;
    openModalForDate(new Date(eventStart).toISOString().slice(0, 10));
  };

  const handleCancelEvent = (id: number) => {
    // Remove from class events state
    setSelectedDateEvents((prev) => prev.filter((ev) => ev.id !== id));
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    // Remove from workout plan events state
    setSelectedWorkoutPlanEvents((prev) =>
      prev.filter((plan) => plan.id !== id)
    );
    setWorkoutPlanEvents((prev) => prev.filter((plan) => plan.id !== id));
  };

  const handleSaveAndClose = () => {
    setIsModalOpen(false);
  };

  // Determine if the selected date is in the past using local time.
  // Create a Date object for today (with time set to midnight).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsedSelectedDate = selectedDate ? parseLocalDate(selectedDate) : null;
  const isPastDate = parsedSelectedDate ? parsedSelectedDate < today : false;

  // Callback to handle a newly added workout plan from AddWorkout component.
  const handleAddWorkout = (newPlan: any) => {
    // Prevent adding a workout for past dates, as in your code
    if (isPastDate) {
      addToast({
        title: "Error",
        description: "Cannot add a workout plan to a past date.",
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    const planObj = newPlan.data ? newPlan.data : newPlan;
    if (!planObj.schedule_time) {
      addToast({
        title: "Error",
        description: "New workout plan does not include a schedule time.",
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    const scheduleValue = planObj.schedule_time;
    const scheduleISO = scheduleValue.includes("T")
      ? scheduleValue
      : scheduleValue.replace(" ", "T");
    const eventTime = new Date(scheduleISO).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const mappedPlan = {
      id: planObj.id,
      planName: planObj.name, // raw name
      title: `${planObj.name} (${eventTime})`, // name + time (for calendar)
      start: scheduleISO,
      eventTime,
      originalColor: colorMap[colors[workoutPlanEvents.length % colors.length]],
      backgroundColor:
        colorMap[colors[workoutPlanEvents.length % colors.length]],
    };

    setWorkoutPlanEvents((prev) => [...prev, mappedPlan]);

    // If the new plan is for the currently selected date, show it in the modal's table
    const planDate = scheduleISO.slice(0, 10);
    if (planDate === selectedDate) {
      setSelectedWorkoutPlanEvents((prev) => [...prev, mappedPlan]);
    }
  };

  const toolbarConfig = {
    left: "prev,next",
    center: "title",
    right: "",
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-800">
        <Sidebar />
      </div>
      {/* Main Content Area */}
      <div className="flex-1 p-0">
        <TriggerModal />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Personal Calendar
        </h1>
        {/* Toggle highlight */}
        <div className="mb-2">
          <Checkbox
            checked={highlightEnabled}
            onChange={(e) => setHighlightEnabled(e.target.checked)}
          >
            Highlight
          </Checkbox>
        </div>
        {/* Calendar Container */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded shadow p-2 relative w-full">
          <style jsx global>{`
            .fc {
              width: 100% !important;
            }
            .fc .fc-toolbar {
              flex-wrap: wrap;
            }
            .fc .fc-toolbar-chunk {
              margin-bottom: 0.5rem;
            }
          `}</style>
          <FullCalendar
            key={highlightEnabled ? "highlight" : "no-highlight"}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={toolbarConfig}
            events={combinedEvents}
            height="auto"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDisplay="block"
            displayEventTime={false}
            style={{ width: "100%" }}
          />
        </div>
      </div>
      {/* Modal showing events on selected date */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalContent>
            <ModalHeader>
              <h3 className="text-lg font-bold">Events on {formattedDate}</h3>
            </ModalHeader>
            <ModalBody>
              {/* Workout Plans Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold">Workout Plans</h4>
                  <Button
                    isDisabled={isPastDate}
                    color="primary"
                    variant="ghost"
                    onPress={() => setIsAddWorkoutModalOpen(true)}
                  >
                    Add Workout
                  </Button>
                </div>
                {selectedWorkoutPlanEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border">Time</th>
                          <th className="p-2 border">Workout Name</th>
                          <th className="p-2 border">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWorkoutPlanEvents.map((plan) => (
                          <tr key={plan.id}>
                            {/* Use plan.eventTime for the Time column */}
                            <td className="p-2 border text-center">
                              {plan.eventTime}
                            </td>

                            {/* Use plan.planName for the Workout Name column */}
                            <td className="p-2 border text-center">
                              {plan.planName}
                            </td>

                            <td className="p-2 border text-center">
                              <Button
                                isDisabled={isPastDate}
                                color="danger"
                                onPress={() => handleCancelEvent(plan.id)}
                              >
                                Cancel
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-4">
                    No workout plans scheduled for this date.
                  </p>
                )}
              </div>

              {/* Classes Table */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-2">Classes</h4>
                {selectedDateEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border">Time</th>
                          <th className="p-2 border">Class Name</th>
                          <th className="p-2 border">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDateEvents.map((ev) => (
                          <tr key={ev.id}>
                            <td className="p-2 border text-center">
                              {ev.eventTime}
                            </td>
                            <td className="p-2 border text-center">
                              {ev.className}
                            </td>
                            <td className="p-2 border text-center">
                              <Button
                                isDisabled={isPastDate} // Disable Cancel button for past dates.
                                color="danger"
                                onPress={() => handleCancelEvent(ev.id)}
                              >
                                Cancel
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-4">No classes scheduled for this date.</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-end">
                <Button
                  color="danger"
                  variant="ghost"
                  onPress={handleSaveAndClose}
                >
                  Close
                </Button>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      {/* Add Workout Modal */}
      <AddWorkout
        isOpen={isAddWorkoutModalOpen}
        onClose={() => setIsAddWorkoutModalOpen(false)}
        onAdd={handleAddWorkout}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Dashboard;
