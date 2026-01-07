"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CountryData {
  name: string;
  code: string;
  flag: string;
  phoneCode: string;
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag"
        );
        const data = await res.json();

        const formattedCountries: CountryData[] = data
          .map((c: any) => ({
            name: c.name.common,
            code: c.cca2, // Need ISO code for state API
            flag: c.flag,
            phoneCode: c.idd.root
              ? c.idd.root + (c.idd.suffixes?.[0] || "")
              : "",
          }))
          .sort((a: CountryData, b: CountryData) =>
            a.name.localeCompare(b.name)
          );

        setCountries(formattedCountries);

        const codes = formattedCountries
          .filter((c) => c.phoneCode)
          .map((c) => ({ code: c.phoneCode, country: c.code }))
          .sort((a, b) => a.code.localeCompare(b.code)); // Sort by code (e.g., +1, +20...)

        setPhoneCodes(codes);
      } catch (e) {
        console.error("Init failed", e);
      }
    };
    init();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  // --- STEP 1: Credentials & Role Check ---
  const handleNextStep1 = async () => {
    if (!formData.email || !formData.password)
      return alert("Please fill in all fields");

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", formData.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setIsTenant(true);
      } else {
        setIsTenant(false);
      }
      setStep(2);
    } catch (error) {
      console.error("Error checking user:", error);
      alert("Error verifying email. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: Personal Info ---
  const handleNextStep2 = () => {
    if (!formData.firstName || !formData.lastName)
      return alert("Please enter your name");
    setStep(3);
  };

  // --- STEP 3: Final Submission ---
  const handleSignup = async () => {
    // Optional: Force address verification before signup
    if (!addressVerified || !formData.lat || !formData.lon) {
      // You can comment this out if you want to allow signup without coordinates
      return alert("Please click 'Verify' to confirm your address location.");
    }

    setIsLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Prepare Data
      const fullPhone = `${formData.phoneCode}${formData.phoneNumber}`;

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: fullPhone,
        country: formData.country,
        state: formData.state,
        address: formData.address,
        city: formData.city,
        // Save Coordinates
        location: {
          lat: formData.lat,
          lon: formData.lon,
        },
        updatedAt: serverTimestamp(),
      };

      if (isTenant) {
        // TENANT FLOW (Updating invite doc)
        await updateDoc(doc(db, "users", formData.email), {
          ...userData,
          uid: user.uid,
          role: "tenant",
          onboarded: true,
        });
      } else {
        // ADMIN FLOW (Creating new doc)
        await setDoc(doc(db, "users", user.uid), {
          ...userData,
          email: formData.email,
          smartDbId: formData.smartDbId,
          role: "admin",
          onboarded: true,
          createdAt: serverTimestamp(),
        });
      }

      router.push("/");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADDRESS VERIFICATION LOGIC ---
  //   const verifyAddress = async () => {
  //     // Basic validation
  //     if (!formData.address || !formData.city || !formData.country) {
  //       alert("Please fill in Address, City, and Country first.");
  //       return;
  //     }

  //     setIsVerifyingAddr(true);
  //     setAddressVerified(false);

  //     try {
  //       // Free OpenStreetMap API (Nominatim)
  //       const query = `${formData.address}, ${formData.city}, ${formData.country}`;
  //       const encodedQuery = encodeURIComponent(query);

  //       const res = await fetch(
  //         `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`
  //       );
  //       const data = await res.json();

  //       if (data && data.length > 0) {
  //         // Found it!
  //         const location = data[0];
  //         setAddressVerified(true);

  //         // Save Lat/Lon
  //         setFormData((prev) => ({
  //           ...prev,
  //           lat: parseFloat(location.lat),
  //           lon: parseFloat(location.lon),
  //         }));
  //       } else {
  //         alert(
  //           "We couldn't find this location. Please check the spelling or add more details."
  //         );
  //       }
  //     } catch (error) {
  //       console.error("Address verification failed", error);
  //       alert("Could not verify address at this time. Please try again.");
  //     } finally {
  //       setIsVerifyingAddr(false);
  //     }
  //   };

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

  // --- GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const tenantRef = doc(db, "users", user.email || "no-email");
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
          // Is Tenant
          const tenantData = tenantSnap.data();
          await setDoc(userDocRef, {
            ...tenantData,
            uid: user.uid,
            firstName: user.displayName?.split(" ")[0] || "",
            lastName: user.displayName?.split(" ")[1] || "",
            onboarded: false, // Must complete profile for address/phone
            updatedAt: serverTimestamp(),
          });
        } else {
          // Is New Admin
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(" ")[0] || "",
            lastName: user.displayName?.split(" ")[1] || "",
            role: "admin",
            smartDbId: "",
            phone: "",
            country: "",
            city: "",
            address: "",
            onboarded: false, // Must complete profile
            createdAt: serverTimestamp(),
          });
        }
      }
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code !== "auth/cancelled-popup-request") {
        console.error("Google Sign-In Error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card
        className={`w-full shadow-lg ${step > 1 ? "max-w-lg" : "max-w-md"}`}
      >
        <CardHeader>
          <CardTitle>
            {step === 1 && "Create Account"}
            {step === 2 && "Personal Info"}
            {/* {step === 3 && "Location & Contact"} */}
          </CardTitle>
          <CardDescription>
            Step {step} of 2 • {isTenant ? "Tenant Setup" : "Account Setup"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* --- STEP 1: CREDENTIALS --- */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 2: PERSONAL INFO --- */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                {/*First Name*/}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                {/*Last Name*/}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              {/* Phone */}
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex gap-2">
                  {/* Phone Code Combobox */}
                  <Popover open={openPhone} onOpenChange={setOpenPhone}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-27.5 justify-between px-2 ${
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
              {/* --- SEARCHABLE COUNTRY SELECT --- */}
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
                      {formData.country
                        ? formData.country
                        : "Select country..."}
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
                    <PopoverTrigger asChild>
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
                    <MapPin size={12} /> Coordinates found:{" "}
                    {formData.lat?.toFixed(4)}, {formData.lon?.toFixed(4)}
                  </p>
                )}
                {!addressVerified && formData.address.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    Click verify to confirm this location exists.
                  </p>
                )}
              </div>

              {/* Admin ID */}
              {!isTenant && (
                <div className="space-y-2">
                  <Label
                    htmlFor="smartDbId"
                    className="flex items-center gap-2"
                  >
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
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between w-full gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                className="w-48"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}

            {step < 2 ? (
              <Button
                className="w-full"
                onClick={step === 1 ? handleNextStep1 : handleNextStep2}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next Step
              </Button>
            ) : (
              <Button
                className="w-48"
                onClick={handleSignup}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            )}
          </div>

          {step === 1 && (
            <>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline text-primary">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
