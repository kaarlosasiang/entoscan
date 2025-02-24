import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MyStatusBar from "./components/MyStatusBar";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { Link } from "expo-router";
import { account, registerUser } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

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

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    const fullname = `${firstName} ${lastName}`;

    try {
      const user = await account.create(ID.unique(), email, password, fullname);
      console.log("User registered:", user);
      return user;
    } catch (error: any) {
      console.log(error.message);

      Alert.alert("Error", error.message, [{ text: "OK" }]);
      return error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center bg-white">
      <View className="px-6 pt-8">
        <Text className="text-4xl font-rubik-medium text-black-300">
          Create Account
        </Text>

        <View className="mt-8 flex flex-col gap-4">
          {/* Name Inputs Row */}
          <View className="flex-row gap-4">
            <TextInput
              className="flex-1 px-4 py-3.5 rounded-lg bg-white border border-gray-200"
              placeholder="First Name"
              autoCapitalize="words"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              className="flex-1 px-4 py-3.5 rounded-lg bg-white border border-gray-200"
              placeholder="Last Name"
              autoCapitalize="words"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

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

          {/* Confirm Password Input */}
          <View className="relative">
            <TextInput
              className="w-full px-4 py-3.5 rounded-lg bg-white border border-gray-200 pr-12"
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              className="absolute right-4 top-3.5"
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Image source={icons.eye} className="w-6 h-6 opacity-50" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            aria-disabled={isLoading}
            className={`w-full py-3.5 bg-blue-500 rounded-full mt-4 ${
              isLoading
                ? "bg-primary-300"
                : "bg-gradient-to-r from-blue-600 to-blue-500 active:from-blue-700 active:to-blue-600"
            }`}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-rubik-medium text-lg">
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          {/* Rest of the components remain the same */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-gray-400">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          <Text className="text-center text-gray-500 mb-4">Sign up using</Text>
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

          <Text className="text-center text-gray-500 text-sm mt-6">
            By continuing, you agree to our{" "}
            <Text className="text-blue-500">Terms of Use</Text> and{"\n"}
            <Text className="text-blue-500">
              Privacy Policy and Content Policies
            </Text>
          </Text>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/signin" asChild>
              <TouchableOpacity>
                <Text className="text-blue-500">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;
