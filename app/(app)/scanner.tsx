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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { config, database, storage } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { Alert } from "react-native";
import { predictionFormApi } from "@/lib/axios";

const insectData = {
  "Abatocera leonina": {
    name: "Abatocera leonina",
    description:
      "Abatocera leonina is a beetle that is native to the Philippines and the Celebes Islands. It is part of the genus Abatocera, which was established in 1878 by J. Thomson. The species was described by J. Thomson in 1865.",
    features:
      "Size: Large, typically around 40–60 mm in length. Body Shape: Elongated and cylindrical, typical of longhorn beetles. Coloration: Generally brownish to grayish, sometimes with a mottled pattern that provides camouflage against tree bark. Antennae: Very long, often exceeding the length of the body, a distinguishing feature of longhorn beetles. Wings: Has functional elytra (hardened forewings) covering.",
    habitat:
      "Forest: Prefers rainforests, tropical woodlands, and secondary forests with plenty of host trees. Tree dwelling: Adults and larvae are often found on hardwood trees, where they feed and develop. Plantations & Orchards: Can also be found in fruit orchards and plantations, especially where host plants like mango, fig, or rubber trees are present.",
  },
  "Abatocera luzonica": {
    name: "Abatocera luzonica",
    description:
      "Abatocera luzonica is a species of longhorn beetle in the family Cerambycidae. It is native to the Philippines, particularly Luzon, which is reflected in its name. This species is primarily associated with forested habitats where it feeds on plant material, including tree bark and wood. It has a robust body, long antennae (often longer than its body), and a distinctive coloration with patterns that help it blend into tree bark.",
    features:
      "Size: Large, typically around 50–70 mm in length. Body Color: Usually brownish-gray with a mottled or speckled pattern that provides camouflage. Antennae: Extremely long, often extending beyond twice the length of the body, a key characteristic of longhorn beetles. Elytra (Wing Covers): Hard, somewhat textured, and adorned with light-colored patches or speckles. Legs: Slender and covered in fine hairs, adapted for gripping tree bark.",
    habitat:
      "Found mainly in the Philippines, often in forests, plantations, and wooded areas. Prefers hardwood trees for laying eggs, with larvae boring into wood for development. Occasionally seen in orchards and plantations, where they can be pests.",
  },
  "Apriona jirouxi": {
    name: "Apriona jirouxi",
    description:
      "Apriona jirouxi is a species of longhorn beetle (family Cerambycidae) found in Southeast Asia. It belongs to the genus Apriona, which includes large wood-boring beetles known for their elongated bodies and long antennae.",
    features:
      "Size: Medium to large, like other Apriona species. Body Shape: Cylindrical and elongated. Color: Likely brown or grayish, with patterns that help in camouflage. Antennae: Long, typically longer than the body in males.",
    habitat:
      "Found in forested areas, often associated with host trees where the larvae bore into wood.",
  },
  "Apriona rixator": {
    name: "Apriona rixator",
    description:
      "Apriona rixator is a species of longhorn beetle in the family Cerambycidae, belonging to the genus Apriona. This genus consists of large wood-boring beetles, often considered pests due to their larvae feeding on trees.",
    features:
      "Size: Medium to large, like other Apriona species. Body Shape: Elongated and cylindrical. Coloration: Typically brown or grayish, with possible mottled patterns for camouflage. Antennae: Very long, often exceeding the body length, particularly in males. Larval Stage: Wood-boring, potentially damaging trees by tunneling into trunks and branches.",
    habitat:
      "Found in forested regions, likely in tropical or subtropical areas.",
  },
  "Batocera magica": {
    name: "Batocera magica",
    description:
      "Batocera magica is a species of longhorn beetle in the family Cerambycidae. It belongs to the genus Batocera, which consists of large, wood-boring beetles commonly found in tropical and subtropical regions.",
    features:
      "Size: Batocera magica is a relatively large beetle, typical of its genus, with elongated bodies and long antennae that can be longer than its body. Coloration: It often exhibits earthy tones such as brown, gray, or mottled patterns that help with camouflage on tree bark.",
    habitat:
      "This species is usually found in forested areas where it inhabits trees and feeds on plant material, particularly wood and bark.",
  },
  "Batocera rubus": {
    name: "Batocera rubus",
    description:
      "Batocera rubus is a species of beetle belonging to the family Cerambycidae. It is commonly known as the 'black raspberry longhorn beetle'.",
    features:
      "Size: Adults typically range from 12 to 25 mm in length. Coloration: The body is dark brown to black with a distinctive pattern. Its elytra (wing covers) often have light-colored markings, making it visually striking. The head and thorax are usually darker, with a slightly glossy appearance. Antennae: As is typical for the longhorn beetle family, Batocera rubus has long antennae, often exceeding the length of its body. These antennae are segmented and help the beetle navigate through its environment.",
    habitat:
      "Batocera rubus is often found in woodlands, forests, and areas with abundant plant life, especially around raspberry bushes and other.",
  },
  "Batocera victoriana": {
    name: "Batocera victoriana",
    description:
      "Batocera victoriana is a species of longhorn beetle belonging to the family Cerambycidae. It is primarily found in Southeast Asia, particularly in regions with tropical and subtropical forests. This species is known for its large size and distinctive elongated antennae, which can be longer than its body.",
    features:
      "Typically large, like other members of the Batocera genus. Coloration: Usually brown or grayish with intricate patterns, providing camouflage. Antennae: Very long, often exceeding body length, aiding in sensory perception.",
    habitat: "Found in forested areas where host plants are available.",
  },
};

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const { user } = useAuth();
  const [insectName, setInsectName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [habitat, setHabitat] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("");

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
      setIsLoading(true);
      await classifyImage(photo.uri);
      setIsLoading(false);
    }
  }

  // New function to classify image
  const classifyImage = async (imageUri: string) => {
    try {
      const formData = new FormData();

      // Append the image file
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "image.jpg",
      });

      const response = await predictionFormApi.post("/classify/", formData);
      console.log(response.data);
      
      const { predicted_class, confidence } = response.data;

      // Set predefined name and description based on classification
      const insectInfo = insectData[predicted_class];
      if (insectInfo) {
        setInsectName(insectInfo.name);
        setDescription(insectInfo.description);
        setFeatures(insectInfo.features);
        setHabitat(insectInfo.habitat);
      } else {
        setInsectName(predicted_class);
        setDescription(`Confidence: ${(confidence * 100).toFixed(2)}%`);
      }

      setConfidenceLevel(`Confidence: ${(confidence * 100).toFixed(2)}%`);
    } catch (error: any) {
      console.error("Image classification failed:", error.message);
      Alert.alert("Error", "Failed to classify image. Please try again later.");
    }
  };

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
    insectData: { name: string }
  ) => {
    try {
      const documentResponse = await database.createDocument(
        config.db,
        config.insectsCollectionId,
        ID.unique(),
        {
          insect_name: insectName,
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
        Alert.alert("Error", "Failed to classify insect. Please try again.");
        return;
      }

      // Upload image and create document
      const { fileId } = await uploadImage(capturedImage);
      await createInsectDocument(fileId, {
        name: insectName,
      });

      // Reset form on success
      resetForm();
      Alert.alert("Success", "Insect uploaded successfully!");
    } catch (error: any) {
      console.error("Submission failed:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to upload. Please try again later."
      );
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
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        autofocus="on"
      >
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
              {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <>
                  <Image
                    source={{ uri: capturedImage }}
                    style={{ width: "100%", height: 300 }}
                    className="rounded-xl"
                  />
                  <View className="mt-4 flex flex-col items-center">
                    <Text className="text-2xl font-bold text-center mb-2">
                      {insectName}
                    </Text>
                    <Text className="text-base text-justify mb-2 text-black-300">
                      {confidenceLevel}
                    </Text>
                  </View>

                  <ScrollView className="h-[260px]">
                    <View className="mt-4 flex flex-col gap-4 ">
                      <Text className="text-base text-justify mb-2 text-black-300">
                        {description}
                      </Text>

                      <Text className="text-base text-justify mb-2 text-black-300">
                        {features}
                      </Text>

                      <Text className="text-base text-justify mb-2 text-black-300">
                        {habitat}
                      </Text>
                    </View>
                  </ScrollView>

                  <View className="flex-row justify-between gap-3 mt-4">
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
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
