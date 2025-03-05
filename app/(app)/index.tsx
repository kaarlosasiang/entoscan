import {
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

const pdfsAssets = {
  'How-to-Capture-Tiny-Insects-with-your-Smartphone.pdf': require('../../assets/pdfs/How-to-Capture-Tiny-Insects-with-your-Smartphone.pdf'),
  'Collecting-and-Preserving-Insects.pdf': require('../../assets/pdfs/Collecting-and-Preserving-Insects.pdf'),
  'A-simple-technique-to-capture-contain-and-monitor-the-fresh-emerging-beetles-of-tree-borers.pdf': require('../../assets/pdfs/A-simple-technique-to-capture-contain-and-monitor-the-fresh-emerging-beetles-of-tree-borers.pdf'),
};

export default function Index() {
  const { user } = useAuth();
  const [pdfFiles, setPdfFiles] = useState([
    {
      id: 1,
      title: "How To Capture Tiny Insects With Your Smartphone",
      description: "Learn professional techniques for insect photography",
      icon: "document-text-outline",
      fileName: "How-to-Capture-Tiny-Insects-with-your-Smartphone.pdf"
    },
    {
      id: 2,
      title: "Collecting and Preserving Insects",
      description: "Guide on collecting and preserving insect specimens",
      icon: "book-outline",
      fileName: "Collecting-and-Preserving-Insects.pdf"
    },
    {
      id: 3,
      title: "A Simple technique To Capture Contain And Monitor The Fresh Emerging Beetles Of Tree Borers",
      description: "Techniques to capture and monitor emerging beetles",
      icon: "book-outline",
      fileName: "A-simple-technique-to-capture-contain-and-monitor-the-fresh-emerging-beetles-of-tree-borers.pdf"
    },
  ]);

  if (!user) {
    return <Redirect href="/signin" />;
  }

  const captureSteps = [
    {
      id: 1,
      title: "Find a Good Spot",
      description:
        "Look for insects in natural habitats like forests or gardens",
      icon: "leaf-outline",
    },
    {
      id: 2,
      title: "Position Camera",
      description: "Hold your device steady and frame the insect clearly",
      icon: "camera-outline",
    },
    {
      id: 3,
      title: "Maintain Distance",
      description: "Keep a safe distance to avoid disturbing the insect",
      icon: "resize-outline",
    },
    {
      id: 4,
      title: "Good Lighting",
      description: "Ensure proper lighting for better image quality",
      icon: "sunny-outline",
    },
  ];

  const handlePDFDownload = async (fileName: string) => {
    try {
      const asset = pdfsAssets[fileName];
      if (!asset) {
        throw new Error('PDF file not found');
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Error',
          'Sharing is not available on this device'
        );
        return;
      }

      // Extract the URI from the asset object
      const assetUri = FileSystem.documentDirectory + fileName;

      // First copy the asset to a temporary location
      await FileSystem.writeAsStringAsync(assetUri, asset);

      // Share the PDF from the temporary location
      await Sharing.shareAsync(assetUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download PDF Guide',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error handling PDF:', error);
      Alert.alert(
        'Error',
        'Failed to open the PDF. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView>
        <View className="px-5 mb-14">
          {/* Existing user profile section */}
          <View className="flex flex-row items-center justify-between mt-5">
            <View className="flex flex-row items-center">
              <Image
                source={{ uri: user?.avatar }}
                className="size-12 rounded-full"
              />
              <View className="flex flex-col ml-2 items-start justify-center">
                <Text className="text-xs font-rubik text-black-100">
                  Welcome back
                </Text>
                <Text className="text-base font-rubik-medium text-black-300">
                  {user?.name}
                </Text>
              </View>
            </View>
          </View>

          {/* How to Capture section */}
          <View className="my-5">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
              How to Capture an Insect
            </Text>

            <View className="flex flex-col gap-2">
              {captureSteps.map((step) => (
                <View
                  key={step.id}
                  className="bg-gray-50 p-4 rounded-xl flex-row items-center"
                >
                  <View className="bg-primary-300/10 p-3 rounded-full">
                    <Ionicons
                      name={step.icon as any}
                      size={24}
                      color="#0066FF"
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-rubik-medium text-black-300">
                      {step.id}. {step.title}
                    </Text>
                    <Text className="text-sm font-rubik text-black-100 mt-1">
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* PDF Resources Section */}
          <View className="my-5 mb-20">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
              Helpful Resources
            </Text>

            <View className="flex flex-col gap-2">
              {pdfFiles.map((file) => (
                <TouchableOpacity
                  key={file.id}
                  className="bg-gray-50 p-4 rounded-xl flex-row items-center"
                  onPress={() => handlePDFDownload(file.fileName)}
                >
                  <View className="bg-red-100 p-3 rounded-full">
                    <Ionicons
                      name={file.icon as any}
                      size={24}
                      color="#FF4444"
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-rubik-medium text-black-300">
                      {file.title}
                    </Text>
                    <Text className="text-sm font-rubik text-black-100 mt-1">
                      {file.description}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={24} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
