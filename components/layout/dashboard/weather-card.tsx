"use client";

import { CloudSun, Loader2 } from "lucide-react";
import { Card } from "../../ui/card";
import { UserProfile } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function WeatherCard({
  profile,
}: {
  profile: UserProfile | undefined;
}) {
  const [weather, setWeather] = useState<any>(null);
  // 4. Fetch Weather (Only if profile has location)
  useEffect(() => {
    if (profile?.location?.lat && profile?.location?.lon) {
      const { lat, lon } = profile.location;
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (apiKey) {
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.main) {
              setWeather({
                temp: Math.round(data.main.temp),
                condition: data.weather[0].main,
              });
            }
          })
          .catch((err) => console.error("Weather fetch error", err));
      }
    }
  }, [profile]);
  return (
    <Card className="col-span-1 bg-linear-to-br from-indigo-600 to-purple-700 text-primary border-none flex flex-col justify-between p-6">
      {weather ? (
        <>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-medium opacity-90">
                {profile?.city || "Local"}
              </h4>
              <p className="text-sm opacity-70">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <CloudSun size={32} className="text-yellow-300" />
          </div>
          <div className="mt-4">
            <div className="text-5xl font-bold">{weather.temp}°</div>
            <div className="text-lg font-medium opacity-90 mt-1 capitalize">
              {weather.condition}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-white/50">
          {profile?.location ? (
            <Loader2 className="animate-spin" />
          ) : (
            "No Location Set"
          )}
        </div>
      )}
    </Card>
  );
}
