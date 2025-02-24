import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { config, database } from "@/lib/appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import { Link } from "expo-router";

export default function Onboarding() {
  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        contentContainerClassName={"h-full mb-10"}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={images.onboarding}
          className={"w-full h-4/6"}
          resizeMode="contain"
        />
        <View className={"px-10 -mt-6"}>
          <Text
            className={
              "text-base text-center uppercase font-rubik text-blackk-200"
            }
          >
            Welcome TO
          </Text>
          <Text
            className={
              "text-3xl font-rubik-bold text-black-300 text-center mt-2"
            }
          >
            <Text className={"text-primary-300"}>ENTOSCAN{"\n"}</Text>
            Scan, Identify, Discover
          </Text>

          <Text
            className={"text-lg font-bold text-black-200 text-center mt-12"}
          >
            Login to EntoScan
          </Text>

          <Link href="./signin" asChild>
            <TouchableOpacity
              className={
                "bg-primary-300 shadow-md shadow-zinc-300 rounded-full w-full py-4 mt-5"
              }
            >
              <View className={"flex flex-row items-center justify-center"}>
                <Text className={"text-lg font-rubik-medium text-white ml-2"}>
                  Get Started
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
