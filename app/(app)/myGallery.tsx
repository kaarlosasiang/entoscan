import {
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { database, storage, config } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Update the Category type definition
type Category =
  | "All"
  | "Leonina"
  | "Luzonica"
  | "Jirouxi"
  | "Rixator"
  | "Magica"
  | "Rubus"
  | "Victoriana";

const MyGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [activeTab, setActiveTab] = useState<Category>("All");

  useEffect(() => {
    fetchUserImages();
  }, []);

  const fetchUserImages = async () => {
    try {
      // Get documents from insects collection where uploader is current user
      const response = await database.listDocuments(
        config.db,
        config.insectsCollectionId,
        [Query.equal("uploader", user.$id)]
      );

      // Get the file URLs for each document
      const imagePromises = response.documents.map(async (doc) => {
        // Use getFileView instead of getFilePreview for non-premium accounts
        const fileUrl = storage.getFileView(config.insectsBucket, doc.fileId);

        return {
          url: fileUrl.href, // Access the href property of the URL
          name: doc.insect_name,
          id: doc.$id,
          fileId: doc.fileId, // Add fileId to the image object
        };
      });

      const imageData = await Promise.all(imagePromises);
      console.log("Image data:", imageData); // Debug log
      setImages(imageData);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            // First, get the document to retrieve the fileId
            const document = await database.getDocument(
              config.db,
              config.insectsCollectionId,
              image.id
            );

            // Delete the file from storage using the fileId from the document
            await storage.deleteFile(
              config.insectsBucket,
              document.fileId // Use the fileId from the document
            );

            // Delete the document from database
            await database.deleteDocument(
              config.db,
              config.insectsCollectionId,
              image.id
            );

            // Remove from local state
            setImages((prevImages) =>
              prevImages.filter((img) => img.id !== image.id)
            );

            // Close modal if the deleted image was selected
            if (selectedImage?.id === image.id) {
              setSelectedImage(null);
            }

            Alert.alert("Success", "Image deleted successfully");
          } catch (error) {
            console.error("Failed to delete:", error);
            Alert.alert("Error", "Failed to delete image. " + error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleImagePress = (image) => {
    setSelectedImage(image);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      // Get file download URL from Appwrite
      const fileUrl = storage.getFileDownload(config.insectsBucket, fileId);

      // Download file to temporary location
      const tempFilePath = `${FileSystem.cacheDirectory}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(
        fileUrl.href,
        tempFilePath
      );

      // Share the downloaded file
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Download Image",
        UTI: "public.jpeg",
      });
    } catch (error) {
      console.error("Error handling image download:", error);
      Alert.alert("Error", "Failed to download the image. Please try again.");
    }
  };

  // Update the filter function
  const getFilteredImages = () => {
    if (activeTab === "All") return images;
    return images.filter((image) =>
      image.name.toLowerCase().includes(activeTab.toLowerCase())
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-800">Gallery</Text>
        <Text className="text-gray-500 mt-1">View your insect collection</Text>
      </View>

      {/* Tabs */}
      <View className="border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            "All",
            "Leonina",
            "Luzonica",
            "Jirouxi",
            "Rixator",
            "Magica",
            "Rubus",
            "Victoriana",
          ].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as Category)}
              className={`px-6 py-3 ${
                activeTab === tab ? "border-b-2 border-blue-500" : ""
              }`}
            >
              <Text
                className={`${
                  activeTab === tab
                    ? "text-blue-500 font-semibold"
                    : "text-gray-600"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Gallery Grid */}
      <ScrollView className="flex-1">
        <View className="flex-row flex-wrap justify-between p-4">
          {getFilteredImages().length === 0 ? (
            <Text className="text-center w-full mt-4 text-gray-500">
              No images found in this category
            </Text>
          ) : (
            getFilteredImages().map((image) => (
              <TouchableOpacity
                key={image.id}
                className="w-[48%] mb-4 rounded-lg overflow-hidden shadow-sm"
                onPress={() => handleImagePress(image)}
              >
                <Image
                  source={{ uri: image.url }}
                  style={{
                    width: "100%",
                    height: undefined,
                    aspectRatio: 4 / 3,
                  }}
                  resizeMode="cover"
                />
                <View className="p-2 bg-white flex-row justify-between items-center">
                  <Text
                    className="text-sm font-medium flex-1"
                    numberOfLines={1}
                  >
                    {image.name}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(image);
                    }}
                    className="ml-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDownload(image.fileId, `${image.name}.jpg`);
                    }}
                    className="ml-2"
                  >
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#0066FF"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <View className="flex-row justify-between items-center absolute top-14 w-full px-4 z-10">
              <View></View>
              <TouchableOpacity
                className="p-2"
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <View className="flex-1 justify-center items-center">
                <Image
                  source={{ uri: selectedImage.url }}
                  style={{
                    width: screenWidth,
                    height: screenHeight * 0.7,
                  }}
                  resizeMode="contain"
                />
                <View className="w-full flex flex-row px-5 justify-between items-center">
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => handleDelete(selectedImage)}
                  >
                    <Ionicons name="trash-outline" size={22} color="red" />
                  </TouchableOpacity>
                  <Text className="text-white text-lg px-4">
                    {selectedImage.name}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDownload(
                        selectedImage.fileId,
                        `${selectedImage.name}.jpg`
                      );
                    }}
                    className="ml-2"
                  >
                    <Ionicons
                      name="download-outline"
                      size={24}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyGallery;
