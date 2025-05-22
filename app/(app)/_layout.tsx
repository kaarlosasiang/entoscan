import React, { useEffect, useState } from "react";
import { Tabs, useRouter, Slot } from "expo-router";
import { Image, Text, View, ImageSourcePropType } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import icons from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col items-center">
    <Image
      source={icon}
      tintColor={focused ? "#0061FF" : "#666876"}
      resizeMode="contain"
      className="size-7"
    />
    <Text
      className={`${
        focused
          ? "text-primary-300 font-rubik-medium"
          : "text-black-200 font-rubik"
      } text-xs w-full text-center mt-1`}
    >
      {title}
    </Text>
  </View>
);

export default function AppLayout() {
  const { session, user, role } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark the layout as mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ensure session and user are properly initialized before redirecting
    if (isMounted) {
      if (session === false) {
        // No session, redirect to signin
        router.replace("/signin");
      } else if (session && !user) {
        // Session exists but no user, redirect to signin
        router.replace("/signin");
      }
    }
  }, [session, user, isMounted]);

  // Render the layout only after mounting
  if (!isMounted) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "white",
          position: "absolute",
          borderTopColor: "#0061FF1A",
          borderTopWidth: 0.5,
          minHeight: 70,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.home} focused={focused} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Classes",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.modules} focused={focused} title="Classes" />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scan",
          href: role === "student" ? "/scanner" : null,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.qrcode} focused={focused} title="Scan" />
          ),
        }}
      />
      <Tabs.Screen
        name="myGallery"
        options={{
          title: "Gallery",
          headerShown: false,
          href: role === "student" ? "/myGallery" : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.gallery} focused={focused} title="Gallery" />
          ),
        }}
      />
      <Tabs.Screen
        name="faculties"
        options={{
          title: "Faculties",
          headerShown: false,
          href: role === "admin" ? "/faculties" : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.user} focused={focused} title="Faculties" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.user} focused={focused} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
