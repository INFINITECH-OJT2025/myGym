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
} from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function Facilities() {
  const [isMobile, setIsMobile] = useState(false);
  const [showFacilities, setShowFacilities] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  interface Facility {
    id: number;
    name: string;
    description: string;
    is_available: boolean;
  }
  
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);
  const [originalFacilitiesData, setOriginalFacilitiesData] = useState<Facility[]>([]);
  interface Equipment {
    id: number;
    name: string;
    description: string;
    quantity: number;
    is_available: boolean;
  }

  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [facilityPage, setFacilityPage] = useState(1);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async (endpoint, setState) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/${endpoint}`);
      setState(data);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      addToast({
        title: "Error",
        description: `Error fetching ${endpoint}`,
        color: "danger",
      });
    }
  };

  useEffect(() => {
    if (showFacilities) {
      axios
        .get(`${API_BASE}/api/facilities`)
        .then(({ data }) => {
          setFacilitiesData(data);
          setOriginalFacilitiesData(data);
        })
        .catch((error) => {
          console.error("Error fetching facilities:", error);
          addToast({
            title: "Error",
            description: "Error fetching facilities",
            color: "danger",
          });
        });
    }
  }, [showFacilities]);

  useEffect(() => {
    if (showEquipment) fetchData("equipment", setEquipmentData);
  }, [showEquipment]);

  const paginatedFacilities = facilitiesData.slice(
    (facilityPage - 1) * itemsPerPage,
    facilityPage * itemsPerPage
  );

  const paginatedEquipment = equipmentData.slice(
    (equipmentPage - 1) * itemsPerPage,
    equipmentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div
        className={`flex-1 p-5 transition-all duration-300 ${!isMobile ? "ml-72" : ""}`}
      >
        <h1 className="text-2xl font-bold">Facilities & Equipment</h1>
        <p className="text-gray-600 mt-2">
          Manage your Facilities and Equipments here.
        </p>

        <div className="mt-5 flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showFacilities}
              onChange={(e) => setShowFacilities(e.target.checked)}
            />
            <span>Show Facilities</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showEquipment}
              onChange={(e) => setShowEquipment(e.target.checked)}
            />
            <span>Show Equipment</span>
          </label>
        </div>

        {showFacilities && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            {/* Autocomplete now acts only as a search input */}
            <Autocomplete
              allowsCustomValue
              label="Search Facilities"
              variant="bordered"
              placeholder="Search facilities..."
              className="max-w-xs"
              onInputChange={(value) => {
                if (value === "") {
                  // Restore the full list when input is empty
                  setFacilitiesData(originalFacilitiesData);
                } else {
                  // Filter based on the search query
                  setFacilitiesData(
                    originalFacilitiesData.filter((facility) =>
                      facility.name.toLowerCase().includes(value.toLowerCase())
                    )
                  );
                }
              }}
              items={[]} // no suggestions
            >
              {/* Empty children to satisfy the required prop */}
              <></>
            </Autocomplete>

            {paginatedFacilities.map((facility) => (
              <Card key={facility.id} className="mt-4">
                <CardBody>
                  <div className="font-bold mb-2">{facility.name}</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {facility.description}
                  </div>
                  <div
                    className={`text-sm ${
                      facility.is_available ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {facility.is_available ? "Available" : "Unavailable"}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button color="default" size="sm">
                      Edit
                    </Button>
                    <Button color="danger" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}

            <div className="flex justify-center mt-4">
              <Pagination
                color="default"
                total={Math.ceil(facilitiesData.length / itemsPerPage)}
                initialPage={facilityPage}
                onChange={setFacilityPage}
              />
            </div>
          </div>
        )}

        {showEquipment && (
          <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-800">
            <Autocomplete
              allowsCustomValue
              label="Search Equipement"
              variant="bordered"
              placeholder="Search Equipment..."
              className="max-w-xs"
              onInputChange={(value) => {
                if (value === "") {
                  // Restore the full list when input is empty
                  setEquipmentData(equipmentData);
                } else {
                  // Filter based on the search query
                  setEquipmentData(
                    equipmentData.filter((equipment) =>
                      equipment.name.toLowerCase().includes(value.toLowerCase())
                    )
                  );
                }
              }}
              items={[]} // no suggestions
            >
              <></>
            </Autocomplete>

            {paginatedEquipment.map((equipment) => (
              <Card key={equipment.id} className="mt-4">
                <CardBody>
                  <div className="font-bold mb-2">{equipment.name}</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {equipment.description}
                  </div>
                  <div className="text-sm">Quantity: {equipment.quantity}</div>
                  <div
                    className={`text-sm ${
                      equipment.is_available ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {equipment.is_available ? "Available" : "Unavailable"}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button color="primary" size="sm">
                      Edit
                    </Button>
                    <Button color="danger" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}

            <div className="flex justify-center mt-4">
              <Pagination
                color="primary"
                total={Math.ceil(equipmentData.length / itemsPerPage)}
                initialPage={equipmentPage}
                onChange={setEquipmentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
