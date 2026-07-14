import type { CreateMissionPayload, Mission } from "@/lib/api-client";
import type { NewMissionForm } from "@/components/dispatcher/missions/NewMissionFormPanel";

export const initialMissionForm: NewMissionForm = {
  title: "",
  cargoDescription: "",
  fromCity: "",
  from: "",
  fromStreetNumber: "",
  toCity: "",
  to: "",
  toStreetNumber: "",
  urgency: "medium",
  idealDeliveryDate: "",
  idealDeliveryTime: "",
  cooling: "no",
  heavyLoad: "no",
};

function getIdealDeliveryIso(body: NewMissionForm) {
  if (!body.idealDeliveryDate || !body.idealDeliveryTime) return null;
  return new Date(`${body.idealDeliveryDate}T${body.idealDeliveryTime}:00`).toISOString();
}

function buildAddress(address: string, streetNumber: string, city: string) {
  const streetAddress = streetNumber.trim()
    ? `${address.trim()} ${streetNumber.trim()}`
    : address.trim();
  return city.trim() ? `${streetAddress}, ${city.trim()}` : streetAddress;
}

export function buildMissionPayload(body: NewMissionForm): CreateMissionPayload {
  const isHeavyLoad = body.heavyLoad === "yes";
  return {
    title: body.title.trim() || body.cargoDescription.trim().slice(0, 40) || "New Delivery Mission",
    description: body.cargoDescription,
    priority: body.urgency,
    ideal_delivery_time: getIdealDeliveryIso(body),
    cargo: {
      weight_kg: isHeavyLoad ? 120 : 20,
      volume_liters: isHeavyLoad ? 250 : 60,
      requires_cooling: body.cooling === "yes",
    },
    pickup: { lat: 0, lng: 0, address: buildAddress(body.from, body.fromStreetNumber, body.fromCity) },
    dropoff: { lat: 0, lng: 0, address: buildAddress(body.to, body.toStreetNumber, body.toCity) },
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function splitAddress(value: string) {
  const [streetPart = "", ...cityParts] = value.split(",");
  const numberMatch = streetPart.trim().match(/^(.*?)(?:\s+(\d+[A-Za-z-]*))?$/);
  return {
    street: numberMatch?.[1]?.trim() || streetPart.trim(),
    number: numberMatch?.[2] || "",
    city: cityParts.join(",").trim(),
  };
}

export function missionToForm(mission: Mission): NewMissionForm {
  const pickup = splitAddress(mission.pickup.address);
  const dropoff = splitAddress(mission.dropoff.address);
  const isHeavyLoad = mission.cargo.weight_kg >= 80 || mission.cargo.volume_liters >= 150;

  return {
    title: mission.title,
    cargoDescription: mission.description,
    fromCity: pickup.city,
    from: pickup.street,
    fromStreetNumber: pickup.number,
    toCity: dropoff.city,
    to: dropoff.street,
    toStreetNumber: dropoff.number,
    urgency: mission.priority,
    idealDeliveryDate: toDateInputValue(mission.ideal_delivery_time),
    idealDeliveryTime: toTimeInputValue(mission.ideal_delivery_time),
    cooling: mission.cargo.requires_cooling ? "yes" : "no",
    heavyLoad: isHeavyLoad ? "yes" : "no",
  };
}

export function validateMissionForm(form: NewMissionForm) {
  if (!form.cargoDescription.trim() || !form.fromCity.trim() || !form.from.trim() || !form.fromStreetNumber.trim() || !form.toCity.trim() || !form.to.trim() || !form.toStreetNumber.trim()) {
    return "Please fill cargo description, pickup/dropoff address, and street numbers.";
  }
  return null;
}
