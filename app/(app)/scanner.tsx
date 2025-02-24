import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import {
  Button,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { config, database, storage } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { Alert } from "react-native";

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const { user } = useAuth();
  const [insectName, setInsectName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const getAllFiles = async () => {
      try {
        const result = await storage.listFiles(config.insectsBucket);
        // console.log(result);
      } catch (error) {
        console.error(error.message);
      }
    };
    getAllFiles();
  }, []); // Added dependency array to prevent infinite loop

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-center pb-2">
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-500 p-2 rounded"
        >
          <Text className="text-white">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedImage(photo.uri);
      setIsModalVisible(true);
    }
  }

  // Separate image upload logic
  const uploadImage = async (imageUri: string) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileName = `image_${Date.now()}.jpg`;
      const imageFile = new File([blob], fileName, { type: "image/jpeg" });
      
      const fileId = ID.unique();
      const uploadResponse = await storage.createFile(
        config.insectsBucket,
        fileId,
        {
          name: imageFile.name,
          type: imageFile.type,
          size: imageFile.size,
          uri: imageUri,
        }
      );

      if (!uploadResponse) {
        throw new Error("Failed to upload image");
      }

      return { fileId, uploadResponse };
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  };

  // Separate document creation logic
  const createInsectDocument = async (
    fileId: string, 
    insectData: { name: string; description: string; }
  ) => {
    try {
      const documentResponse = await database.createDocument(
        config.db,
        config.insectsCollectionId,
        ID.unique(),
        {
          name: insectData.name,
          description: insectData.description,
          fileId: fileId,
          uploader: user.$id,
        }
      );

      return documentResponse;
    } catch (error) {
      console.error("Document creation failed:", error);
      throw new Error(`Document creation failed: ${error.message}`);
    }
  };

  const submitHandler = async () => {
    try {
      // Input validation
      if (!capturedImage?.trim()) {
        throw new Error("No image captured");
      }

      if (!insectName.trim()) {
        Alert.alert("Error", "Please enter an insect name");
        return;
      }

      // Upload image and create document
      const { fileId } = await uploadImage(capturedImage);
      await createInsectDocument(fileId, {
        name: insectName,
        description: description.trim(),
      });

      // Reset form on success
      resetForm();
      Alert.alert("Success", "Insect uploaded successfully!");
    } catch (error: any) {
      console.error("Submission failed:", error);
      Alert.alert("Error", error.message || "Failed to upload. Please try again later.");
    }
  };

  // Helper function to reset form
  const resetForm = () => {
    setInsectName("");
    setDescription("");
    setIsModalVisible(false);
    setCapturedImage(null);
  };

  // Helper function to handle modal close
  const handleModalClose = () => {
    resetForm();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <View className="flex-1 flex-row justify-center items-end mb-24">
          <TouchableOpacity
            onPress={takePicture}
            className="bg-white border-10 p-1 rounded-full"
          >
            <View className="size-16 bg-white border border-gray-400 rounded-full"></View>
          </TouchableOpacity>
        </View>
      </CameraView>

      {capturedImage && (
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/90 bg-opacity-75">
            <View className="w-[90%] bg-white p-4 rounded-2xl">
              <Image
                source={{ uri: capturedImage }}
                style={{ width: "100%", height: 300 }}
                className="rounded-xl"
              />

              <View className="mt-4 flex flex-col gap-4">
                <View>
                  <Text className="text-black font-semibold mb-1">
                    Insect Name
                  </Text>
                  <TextInput
                    value={insectName}
                    onChangeText={setInsectName}
                    placeholder="Enter insect name"
                    className="border border-gray-300 rounded-lg p-2"
                  />
                </View>

                <View>
                  <Text className="text-black font-semibold mb-1">
                    Description
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter description"
                    editable
                    multiline
                    numberOfLines={4}
                    maxLength={40}
                    className="border border-gray-300 rounded-lg p-2"
                  />
                </View>
              </View>

              <View className="flex-row justify-end gap-3 mt-4">
                <TouchableOpacity
                  onPress={handleModalClose}
                  className="bg-gray-200 px-4 py-2 rounded-full"
                >
                  <Text className="text-black font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitHandler}
                  className="bg-blue-500 px-4 py-2 rounded-full"
                >
                  <Text className="text-white font-semibold">Upload</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
