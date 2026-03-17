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

  useEffect(() => {
    if (profile?.location?.lat && profile?.location?.lon) {
      const { lat, lon } = profile.location;
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (apiKey) {
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
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
    <Card className="bg-linear-to-br from-indigo-600 to-purple-700 text-white border-none flex flex-col justify-between p-6 shadow-md h-full min-h-35">
      {weather ? (
        <>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-medium opacity-90">
                {profile?.city || "Local"}
              </h4>
              <p className="text-sm opacity-70">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <CloudSun size={32} className="text-yellow-300 drop-shadow-md" />
          </div>
          <div className="mt-4">
            <div className="text-5xl font-bold tracking-tighter">
              {weather.temp}°
            </div>
            <div className="text-sm font-medium opacity-90 mt-1 capitalize tracking-wide">
              {weather.condition}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-white/70 space-y-2">
          {profile?.location ? (
            <Loader2 className="animate-spin h-6 w-6" />
          ) : (
            <span className="text-sm font-medium text-white/50">
              Location not set
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
