import { View, Text, ActivityIndicator } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoadingPage() {
  return (
    <SafeAreaView className="h-full flex flex-row items-center justify-center">
      <ActivityIndicator size="large" />
    </SafeAreaView>
  );
}
