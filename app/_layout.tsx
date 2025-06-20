import { Slot, SplashScreen } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFonts } from "expo-font";
import "@/global.css";
import { useEffect } from "react";
import MyStatusBar from "./components/MyStatusBar";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("@/assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("@/assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("@/assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("@/assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("@/assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("@/assets/fonts/Rubik-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  return (
    <AuthProvider>
      <MyStatusBar />
      <Slot />
    </AuthProvider>
  );
}
