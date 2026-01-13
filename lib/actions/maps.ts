"use server"

export async function getGoogleMapsScriptUrl() {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  if (!mapsKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY is not configured")
  }

  return `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`
}
