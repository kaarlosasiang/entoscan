import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import BackButton from "./components/BackButton";
import { SafeAreaView } from "react-native-safe-area-context";
import MyStatusBar from "./components/MyStatusBar";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { Link, Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { user, signin } = useAuth();

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      // console.log(email, password);

      signin({ email, password });
    } catch (error) {
      Alert.alert("Error", "Failed to sign in. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      <Redirect href="/" />;
    }
  }, [user]);

  return (
    <SafeAreaView className="flex-1 justify-center bg-white">
      <View className="px-6 pt-8">
        <Text className="text-4xl font-rubik-medium text-black-300">
          Welcome back
        </Text>

        <View className="mt-8 flex flex-col gap-4">
          {/* Email Input */}
          <TextInput
            className="w-full px-4 py-3.5 rounded-lg bg-white border border-gray-200"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#9CA3AF"
          />

          {/* Password Input */}
          <View className="relative">
            <TextInput
              className="w-full px-4 py-3.5 rounded-lg bg-white border border-gray-200 pr-12"
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              className="absolute right-4 top-3.5"
              onPress={() => setShowPassword(!showPassword)}
            >
              <Image source={icons.eye} className="w-6 h-6 opacity-50" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="self-end" activeOpacity={0.7}>
            <Text className="text-blue-600 font-medium font-rubik">
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            className={`w-full py-3.5 bg-blue-500 rounded-full mt-4 ${
              isLoading
                ? "bg-primary-300"
                : "bg-gradient-to-r from-blue-600 to-blue-500 active:from-blue-700 active:to-blue-600"
            }`}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-rubik-medium text-lg">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-gray-400">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Social Sign In */}
          <Text className="text-center text-gray-500 mb-4">Sign in using</Text>
          <View className="flex-row justify-center space-x-6">
            <TouchableOpacity className="p-2">
              <Image source={images.google} className="w-8 h-8" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <Image source={images.facebook} className="w-8 h-8" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <Image source={images.apple} className="w-8 h-8" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Don't have an account? </Text>
            <Link href="./signup" asChild>
              <TouchableOpacity>
                <Text className="text-blue-500">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignIn;
