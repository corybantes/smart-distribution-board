"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CheckCircle2, ChevronsUpDown, Loader2 } from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Import CommandList to ensure proper rendering
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useAuth } from "@/context/AuthContext";

// Fetcher for Country API
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CountryData {
  name: string;
  code: string; // ISO Code for state fetching
  flag: string;
  phoneCode: string; // e.g. "+234"
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isTenant, setIsTenant] = useState(false);
  const [isVerifyingAddr, setIsVerifyingAddr] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [phoneCodes, setPhoneCodes] = useState<
    { code: string; country: string }[]
  >([]);
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openPhone, setOpenPhone] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const { userData } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phoneCode: "",
    phoneNumber: "",
    smartDbId: "",
    lat: null as number | null,
    lon: null as number | null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch User Role
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (userData?.onboarded) {
            router.push("/dashboard");
            return;
          }
          if (!user) {
            router.push("/login");
            return;
          }
          const res = await fetch(`/api/user?uid=${user.uid}`);
          const data = await res.json();

          if (data.role === "tenant") setIsTenant(true);

          setFormData((prev) => ({
            ...prev,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
          }));
          setIsCheckingRole(false);
        });

        // Fetch Countries (RestCountries API)
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag"
        );
        const data = await res.json();

        const formattedCountries: CountryData[] = data
          .map((c: any) => ({
            name: c.name.common,
            code: c.cca2,
            flag: c.flag,
            phoneCode: c.idd.root
              ? c.idd.root + (c.idd.suffixes?.[0] || "")
              : "",
          }))
          .sort((a: CountryData, b: CountryData) =>
            a.name.localeCompare(b.name)
          );

        setCountries(formattedCountries);

        // Extract unique phone codes for the dropdown
        const codes = formattedCountries
          .filter((c) => c.phoneCode)
          .map((c) => ({ code: c.phoneCode, country: c.code }))
          .sort((a, b) => a.code.localeCompare(b.code));

        setPhoneCodes(codes);

        return () => unsubscribe();
      } catch (e) {
        console.error("Init failed", e);
      }
    };
    init();
  }, [router]);

  // 2. STATE FETCHING LOGIC
  const handleCountrySelect = async (countryName: string) => {
    // 1. Set Country
    const selectedCountry = countries.find((c) => c.name === countryName);
    setFormData((prev) => ({ ...prev, country: countryName, state: "" })); // Reset state
    setStates([]);
    setOpenCountry(false);

    if (!selectedCountry) return;

    // 2. Fetch States (using countriesnow.space)
    setLoadingStates(true);
    try {
      const res = await fetch(
        "https://countriesnow.space/api/v0.1/countries/states",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryName }), // API uses name, not code usually
        }
      );
      const json = await res.json();

      if (!json.error && json.data.states) {
        setStates(json.data.states.map((s: any) => s.name));
      }
    } catch (err) {
      console.error("Failed to fetch states", err);
    } finally {
      setLoadingStates(false);
    }
  };

  // 3. ADDRESS VERIFICATION (Nominatim)
  const verifyAddress = async () => {
    if (!formData.address || !formData.state || !formData.country) {
      alert("Please select Country, State, and enter Address.");
      return;
    }
    setIsVerifyingAddr(true);
    setAddressVerified(false);
    try {
      // Improved Query: Address, City/Town, State, Country
      const query = `${formData.address}, ${
        formData.city ? formData.city + "," : ""
      } ${formData.state}, ${formData.country}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setAddressVerified(true);
        setFormData((prev) => ({
          ...prev,
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        }));
      } else {
        alert("Location not found. Please verify details.");
      }
    } catch (error) {
      console.error(error);
      alert("Verification failed.");
    } finally {
      setIsVerifyingAddr(false);
    }
  };

  // 4. SUBMIT
  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    if (!addressVerified) {
      // Optional: Block submission
      return alert("Please verify your address.");
    }
    setIsLoading(true);
    try {
      const fullPhone = `${formData.phoneCode}${formData.phoneNumber}`;
      const payload = {
        uid: auth.currentUser.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        phone: fullPhone,
        location: { lat: formData.lat, lon: formData.lon },
        onboarded: true,
        // Add smartDbId if admin
        ...(!isTenant && formData.smartDbId
          ? { smartDbId: formData.smartDbId }
          : {}),
      };

      // CALL PUT API
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API Failed");
      router.push("/dashboard");
    } catch (error) {
      alert("Save failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isCheckingRole)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-gray-500">
            We need a few details to set up your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <div className="flex gap-2">
              {/* Phone Code */}
              <Popover open={openPhone} onOpenChange={setOpenPhone}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={`px-2 ${
                      !formData.phoneCode ? "opacity-50" : ""
                    }`}
                  >
                    {formData.phoneCode ? formData.phoneCode : "+000"}
                    <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-35 p-0">
                  <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                      <CommandGroup>
                        {phoneCodes.map((item, idx) => (
                          <CommandItem
                            key={`${item.code}-${idx}`} // Unique key
                            value={`${item.code} ${item.country}`} // Search by code or country code
                            onSelect={() => {
                              setFormData((prev) => ({
                                ...prev,
                                phoneCode: item.code,
                              }));
                              setOpenPhone(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.phoneCode === item.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {item.code}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                name="phoneNumber"
                placeholder="8012345678"
                className="flex-1"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Country Selection */}
          <div className="space-y-2 flex flex-col">
            <Label>Country</Label>
            <Popover open={openCountry} onOpenChange={setOpenCountry}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCountry}
                  className={`w-full justify-between ${
                    !formData.country ? "text-muted-foreground" : ""
                  }`}
                >
                  {formData.country ? formData.country : "Select country..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-100 p-0">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={country.name}
                          value={country.name}
                          onSelect={(currentValue) =>
                            handleCountrySelect(currentValue)
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.country === country.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {country.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-between gap-4">
            {/* --- SEARCHABLE STATE SELECT --- */}
            <div className="space-y-2 flex flex-col w-full">
              <Label>State / Region</Label>
              <Popover open={openState} onOpenChange={setOpenState}>
                <PopoverTrigger asChild className="w-full">
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openState}
                    className={`w-full justify-between ${
                      !formData.state ? "text-muted-foreground" : ""
                    }`}
                    disabled={!formData.country || loadingStates}
                  >
                    {loadingStates
                      ? "Loading states..."
                      : formData.state
                      ? formData.state
                      : "Select state..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-100 p-0">
                  <Command>
                    <CommandInput placeholder="Search state..." />
                    <CommandList>
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {states.map((state) => (
                          <CommandItem
                            key={state}
                            value={state}
                            onSelect={(val) => {
                              // Command converts value to lowercase, so we use the original map value if needed,
                              // but for display using the original string is better.
                              // NOTE: CommandItem 'value' prop is used for filtering.
                              setFormData((prev) => ({
                                ...prev,
                                state: state,
                              }));
                              setOpenState(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.state === state
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {state}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* City */}
            <div className="space-y-2 w-full">
              <Label>City</Label>
              <Input
                name="city"
                placeholder="Lagos"
                value={formData.city}
                onChange={(e) => {
                  handleChange(e);
                  setAddressVerified(false);
                }}
              />
            </div>
          </div>

          {/* Address with Verification Button */}
          <div className="space-y-2">
            <Label>Residential Address</Label>
            <div className="flex gap-2">
              <Input
                name="address"
                placeholder="123 Marina Street"
                className={
                  addressVerified
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }
                value={formData.address}
                onChange={(e) => {
                  handleChange(e);
                  setAddressVerified(false);
                }}
              />
              <Button
                type="button"
                variant={addressVerified ? "outline" : "secondary"}
                onClick={verifyAddress}
                disabled={isVerifyingAddr || addressVerified}
                className="shrink-0"
              >
                {isVerifyingAddr ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : addressVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            {addressVerified && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> Location confirmed
              </p>
            )}
            {!addressVerified && formData.address.length > 5 && (
              <p className="text-xs text-muted-foreground">
                Click verify to confirm this location exists.
              </p>
            )}
          </div>
          {!isTenant && (
            <div className="space-y-2">
              <Label htmlFor="smartDbId" className="flex items-center gap-2">
                Smart DB ID
                <span className="text-xs text-muted-foreground font-normal">
                  (Admins Only)
                </span>
              </Label>
              <Input
                id="smartDbId"
                name="smartDbId"
                placeholder="Enter Meter/Board ID"
                value={formData.smartDbId}
                onChange={handleChange}
              />
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finish Setup
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
