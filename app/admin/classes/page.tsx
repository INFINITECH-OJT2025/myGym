"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_admin";
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
import AddClassTypeModal from "@/components/add_classtype";
import EditClassTypeModal from "@/components/edit_classtype";
import AddClassesModal from "@/components/add_classes";
import EditClassesModal from "@/components/edit_classes";
import recordShow from "@/components/show";

// Use API_BASE from an environment variable if provided.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function ClassesPage() {
  // Responsive state: determine if the device is mobile (width < 1024px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggling display of classes and class types
  const [showClasses, setShowClasses] = useState(false);
  const [showClassTypes, setShowClassTypes] = useState(false);

  // Modal and delete states
  const [isAddClassTypeModalOpen, setIsAddClassTypeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Interfaces for our data
  interface ClassItem {
    id: number;
    trainer_id: number;
    facilities_id: number;
    class_type_id: number;
    description: string;
    schedule_time: string;
    difficulty: string;
    duration: string;
    max_participants: number;
    class_type: {
      id: number;
      name: string;
      image: string;
    };
    trainer: {
      id: number;
      user: { name: string };
    };
  }

  interface ClassTypeItem {
    id: number;
    name: string;
    image: string;
  }

  // States for classes and class types
  const [classesData, setClassesData] = useState<ClassItem[]>([]);
  const [originalClassesData, setOriginalClassesData] = useState<ClassItem[]>(
    []
  );
  const [classTypesData, setClassTypesData] = useState<ClassTypeItem[]>([]);
  const [originalClassTypesData, setOriginalClassTypesData] = useState<
    ClassTypeItem[]
  >([]);
  const [classesPage, setClassesPage] = useState(1);
  const [classTypesPage, setClassTypesPage] = useState(1);
  const itemsPerPage = 6;

  // New filter states for search and time-of-day filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMorning, setFilterMorning] = useState(true);
  const [filterAfternoon, setFilterAfternoon] = useState(true);
  const [filterEvening, setFilterEvening] = useState(true);

  // Handler for "Add Class" (not implemented yet)
  const handleAddClass = () => {
    addToast({
      title: "Add Class",
      description: "Add Class button clicked.",
      color: "success",
      variant: "flat",
      radius: "full",
      timeout: 3000,
      hideIcon: true,
      classNames: { closeButton: "show" },
    });
    // TODO: Open a modal or navigate to an add class page
  };

  // Fetch classes data when "Show Classes" is checked
  useEffect(() => {
    if (showClasses) {
      axios
        .get<ClassItem[]>(`${API_BASE}/api/classes`)
        .then(({ data }) => {
          console.log("Classes Data:", data); // Log the response
          setOriginalClassesData(data);
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
    }
  }, [showClasses]);

  // Function to fetch class types; reused on load and after new/updated class type added.
  const fetchClassTypes = () => {
    axios
      .get(`${API_BASE}/api/class-types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => {
        setClassTypesData(data);
        setOriginalClassTypesData(data);
      })
      .catch((error) => {
        console.error("Error fetching class types:", error);
        addToast({
          title: "Error",
          description: "Error fetching class types",
          color: "danger",
        });
      });
  };

  // Fetch class types data when "Show Class Types" is checked
  useEffect(() => {
    if (showClassTypes) {
      fetchClassTypes();
    }
  }, [showClassTypes]);

  // New filtering effect: filter originalClassesData based on search term and time filters
  useEffect(() => {
    console.log("Filtering classes with searchTerm:", searchTerm);
    let filtered = originalClassesData;

    // Filter by search term (if not empty) on multiple fields:
    // class name, class type, schedule datetime (formatted), difficulty, duration, and trainer name.
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((cls) => {
        const dateTimeStr = new Date(cls.schedule_time)
          .toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .toLowerCase();
        return (
          cls.name.toLowerCase().includes(lowerSearch) ||
          (cls.class_type &&
            cls.class_type.name.toLowerCase().includes(lowerSearch)) ||
          cls.schedule_time.toLowerCase().includes(lowerSearch) ||
          dateTimeStr.includes(lowerSearch) ||
          cls.difficulty.toLowerCase().includes(lowerSearch) ||
          cls.duration.toLowerCase().includes(lowerSearch) ||
          (cls.trainer &&
            cls.trainer.user.name.toLowerCase().includes(lowerSearch))
        );
      });
    }

    // Apply time-of-day filter based on checkboxes
    filtered = filtered.filter((cls) => {
      const hour = new Date(cls.schedule_time).getHours();
      let include = false;
      if (filterMorning && hour >= 4 && hour <= 10) include = true;
      if (filterAfternoon && hour >= 11 && hour <= 16) include = true;
      if (filterEvening && hour >= 17 && hour <= 20) include = true;
      return include;
    });

    // Sort filtered classes in ascending order by schedule_time
    filtered.sort(
      (a, b) =>
        new Date(a.schedule_time).getTime() -
        new Date(b.schedule_time).getTime()
    );

    console.log("Filtered classes:", filtered);
    setClassesData(filtered);
  }, [
    originalClassesData,
    searchTerm,
    filterMorning,
    filterAfternoon,
    filterEvening,
  ]);

  // Calculate paginated data
  const paginatedClasses = classesData.slice(
    (classesPage - 1) * itemsPerPage,
    classesPage * itemsPerPage
  );
  const paginatedClassTypes = classTypesData.slice(
    (classTypesPage - 1) * itemsPerPage,
    classTypesPage * itemsPerPage
  );

  // Handler for editing a class type – opens the edit modal with selected data.
  const handleEditClassType = (classType: ClassTypeItem) => {
    setSelectedClassType(classType);
    setIsEditModalOpen(true);
  };

  return (
    <div className="flex flex-col sm:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 p-5 transition-all duration-300 ml-0 sm:ml-72">
        <h1 className="text-2xl font-bold">Classes & Class Types</h1>
        <p className="text-gray-600 mt-2">
          Manage your Classes and Class Types here.
        </p>

        {/* Checkboxes arranged in a column on mobile and row on larger screens */}
        <div className="mt-5 flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showClasses}
              onChange={(e) => setShowClasses(e.target.checked)}
            />
            <span>Show Classes</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showClassTypes}
              onChange={(e) => setShowClassTypes(e.target.checked)}
            />
            <span>Show Class Types</span>
          </label>
        </div>

        {/* Classes Section */}
        {showClasses && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Classes</h2>
              <Button
                color="primary"
                size="sm"
                onPress={() => setIsAddClassModalOpen(true)}
              >
                Add Class
              </Button>
            </div>

            <Autocomplete
              allowsCustomValue
              label="Search Classes"
              variant="bordered"
              placeholder="Search classes..."
              className="max-w-xs"
              onInputChange={(value) => {
                console.log("Search term updated:", value);
                setSearchTerm(value);
              }}
              items={[]} // no suggestions
            >
              <></>
            </Autocomplete>

            {/* Time Filter Checkboxes */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
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

            {/* Classes Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px] mt-4">
              {paginatedClasses.map((classItem) => (
                <Card key={classItem.id} className="mt-4">
                  <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
                    <div className="relative w-full">
                      {classItem.class_type?.image && (
                        <div className="w-full flex justify-center">
                          <div className="w-[200px] h-[120px] overflow-hidden rounded-xl">
                            <Image
                              alt="Class Type"
                              src={`${API_BASE}${classItem.class_type.image}`}
                              className="object-cover w-full h-full cursor-pointer"
                              onClick={() => {
                                setModalImageSrc(
                                  `${API_BASE}${classItem.class_type.image}`
                                );
                                setIsImageModalOpen(true);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="mt-2">
                        <h4 className="font-bold text-large">
                          {classItem.class_type?.name || "No Class Type"}
                        </h4>
                        <p className="text-sm text-tiny uppercase font-bold">
                          {classItem.name || "Unnamed Class"}
                        </p>
                        <small className="text-default-500">
                          Schedule:
                          {new Date(classItem.schedule_time).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
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

                      {/* Difficulty, Duration, Max Participants */}
                      <div className="mt-2 text-sm">
                        <p>Difficulty: {classItem.difficulty}</p>
                        <p>Duration: {classItem.duration}</p>
                        <p>Max Participants: {classItem.max_participants}</p>
                      </div>

                      {/* Trainer Name */}
                      <div className="mt-2 text-sm">
                        <p>Trainer: {classItem.trainer?.user?.name}</p>
                      </div>

                      {/* Description Tooltip */}
                      <Tooltip
                        closeDelay={0}
                        delay={0}
                        content={
                          <div className="max-w-xs text-sm text-left text-default-700 whitespace-pre-wrap">
                            {classItem.description}
                          </div>
                        }
                        motionProps={{
                          variants: {
                            exit: {
                              opacity: 0,
                              transition: { duration: 0.1, ease: "easeIn" },
                            },
                            enter: {
                              opacity: 1,
                              transition: { duration: 0.15, ease: "easeOut" },
                            },
                          },
                        }}
                      >
                        <button className="text-sm bg-blue-100 text-blue-700 font-medium px-4 py-1 rounded hover:bg-blue-200 transition-all">
                          View Description
                        </button>
                      </Tooltip>
                    </div>
                  </CardHeader>

                  {/* Edit and Delete Buttons */}
                  <CardBody className="overflow-visible py-2 flex flex-col">
                    <div className="mt-auto flex justify-between items-center">
                      <Button
                        color="primary"
                        size="sm"
                        onPress={() => {
                          recordShow(classItem);
                        }}
                      >
                        Show
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          color="default"
                          size="sm"
                          onPress={() => {
                            setSelectedClass(classItem);
                            setIsEditClassModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          onPress={() => {
                            setItemToDelete(classItem);
                            setDeleteType("class");
                            setIsConfirmDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <Pagination
                color="default"
                total={Math.ceil(classesData.length / itemsPerPage)}
                initialPage={classesPage}
                onChange={setClassesPage}
              />
            </div>
          </div>
        )}

        {/* Class Types Section */}
        {showClassTypes && (
          <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-800">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Class Types</h2>
              <Button
                color="primary"
                size="sm"
                onPress={() => setIsAddClassTypeModalOpen(true)}
              >
                Add Class Type
              </Button>
            </div>

            <Autocomplete
              allowsCustomValue
              label="Search Class Types"
              variant="bordered"
              placeholder="Search class types..."
              className="max-w-xs"
              onInputChange={(value) => {
                if (value === "") {
                  setClassTypesData(originalClassTypesData);
                } else {
                  setClassTypesData(
                    originalClassTypesData.filter((classType) =>
                      classType.name.toLowerCase().includes(value.toLowerCase())
                    )
                  );
                }
              }}
              items={[]} // no suggestions
            >
              <></>
            </Autocomplete>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px] mt-4">
              {paginatedClassTypes.map((classType) => (
                <Card key={classType.id} className="mt-4">
                  <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <p className="text-tiny uppercase font-bold">
                      {classType.name}
                    </p>
                  </CardHeader>
                  <CardBody className="overflow-visible py-2 flex flex-col">
                    {classType.image && (
                      <div className="flex justify-center">
                        <Image
                          alt="Class Type"
                          className="object-cover rounded-xl h-[120px] w-[200px] cursor-pointer"
                          src={`${API_BASE}${classType.image}`}
                          onClick={() => {
                            setModalImageSrc(`${API_BASE}${classType.image}`);
                            setIsImageModalOpen(true);
                          }}
                        />
                      </div>
                    )}
                    <div className="mt-auto flex justify-end gap-2">
                      <Button
                        color="default"
                        size="sm"
                        onPress={() => {
                          setSelectedClassType(classType);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onPress={() => {
                          setItemToDelete(classType);
                          setDeleteType("classType");
                          setIsConfirmDeleteOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <Pagination
                color="primary"
                total={Math.ceil(classTypesData.length / itemsPerPage)}
                initialPage={classTypesPage}
                onChange={setClassTypesPage}
              />
            </div>
          </div>
        )}

        {/* Add/Edit Modals */}
        <AddClassTypeModal
          isOpen={isAddClassTypeModalOpen}
          onClose={() => setIsAddClassTypeModalOpen(false)}
          onClassTypeAdded={() => {
            fetchClassTypes();
          }}
        />

        <AddClassesModal
          isOpen={isAddClassModalOpen}
          onClose={() => setIsAddClassModalOpen(false)}
          onClassAdded={() => {
            setIsAddClassModalOpen(false);
            axios.get(`${API_BASE}/api/classes`).then(({ data }) => {
              setOriginalClassesData(data);
            });
          }}
        />

        {isEditModalOpen && selectedClassType && (
          <EditClassTypeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            classType={selectedClassType}
            onClassTypeUpdated={(updatedData) => {
              setIsEditModalOpen(false);
              fetchClassTypes();
            }}
          />
        )}

        {isEditClassModalOpen && selectedClass && (
          <EditClassesModal
            isOpen={isEditClassModalOpen}
            onClose={() => setIsEditClassModalOpen(false)}
            classItem={selectedClass}
            onClassUpdated={() => {
              axios.get(`${API_BASE}/api/classes`).then(({ data }) => {
                setOriginalClassesData(data);
              });
            }}
          />
        )}

        {/* Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded shadow-lg max-w-[90%] max-h-[90%] overflow-auto">
              <Image
                alt="Enlarged"
                src={modalImageSrc}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="text-right mt-2">
                <Button
                  color="danger"
                  size="sm"
                  onPress={() => setIsImageModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Are you sure you want to delete this{" "}
                {deleteType === "class" ? "class" : "class type"}?
              </h3>
              <div className="flex justify-center gap-4">
                <Button
                  color="danger"
                  onPress={async () => {
                    try {
                      if (deleteType === "class") {
                        await axios.delete(
                          `${API_BASE}/api/classes/${itemToDelete.id}`,
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "token"
                              )}`,
                            },
                          }
                        );
                        setOriginalClassesData((prev) =>
                          prev.filter(
                            (classItem) => classItem.id !== itemToDelete.id
                          )
                        );
                      } else if (deleteType === "classType") {
                        await axios.delete(
                          `${API_BASE}/api/class-types/${itemToDelete.id}`,
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "token"
                              )}`,
                            },
                          }
                        );
                        setClassTypesData((prev) =>
                          prev.filter((t) => t.id !== itemToDelete.id)
                        );
                      }

                      addToast({
                        title: "Deleted",
                        description: `${
                          deleteType === "class" ? "Class" : "Class type"
                        } deleted successfully.`,
                        color: "success",
                      });
                    } catch (error) {
                      addToast({
                        title: "Error",
                        description: "Something went wrong while deleting.",
                        color: "danger",
                      });
                    }
                    setIsConfirmDeleteOpen(false);
                    setItemToDelete(null);
                    setDeleteType(null);
                  }}
                >
                  Yes, Delete
                </Button>

                <Button
                  color="default"
                  onPress={() => {
                    setIsConfirmDeleteOpen(false);
                    setItemToDelete(null);
                    setDeleteType(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
