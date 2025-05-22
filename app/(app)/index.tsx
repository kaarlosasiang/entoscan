import {
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { storage, config } from "@/lib/appwrite";
import Search from "../components/Search";

import magica from "@/assets/images/magica.jpg";
import victoriana from "@/assets/images/victoriana.jpg";
import apriona from "@/assets/images/apriona.jpg";
import leonina from "@/assets/images/leonina.jpeg";
import rubus from "@/assets/images/rubus.webp";
import rixator from "@/assets/images/rixator.jpeg";
import images from "@/constants/images";

export default function Index() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInsect, setSelectedInsect] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const insectData = [
    {
      id: 1,
      name: "Batocera Magica",
      description: `1835 is described from the Talaud Islands, located in the Celebes Sea between Sulawesi and the Philippines. 
Male. Length: 40-55 mm, width: 14-19 mm. Female. Length: 37-51 mm, width: 13-18 mm. The female is similar to the male. The antennae are shorter and extend slightly beyond the elytral apex. Close to the type species, native to Java and the Philippines (Mindanao, Samar), it differs from it.tinged by a darker brown colour, a more wrinkled pronotum and an elytral granulation coarser. The scape, the first antennal article, also has a lateral outgrowthat its extremity.  The first article of the anterior tarsi presents a latero-external outgrowthin the shape of a well-developed thorn. It is easily distinguishable from its scutellum covered withthe same hairiness as that which covers the elytral disc and the white lateral band on the des-under the body is narrower and absent after the second abdominal segment. 
reference:
Rigout (J.), 1988. ─Batocerini 1, The Beetles of the World, vol 1. Editions  Sciences Nat, Venette: 63 pp., 30 pl.  Thomson (J.), 1859.  ─Gender monograph Batocera of the family Cerambycidæ, Arcana Naturae or Natural History Archives , Paris, 2 : 65-84, pls VI-VIII color.
`,
      image: magica,
      carouselImages: [
        images.magica1,
        images.magica2,
        images.magica3,
        images.magica4,
      ],
    },
    {
      id: 2,
      name: "Abatocera Leonina",
      description: `Abatocera leonina is a beetle species distinguished by its reddish-ferruginous derm, densely covered with bright fulvous tomentum. The vertex of the head is granulated, and the prothorax is immaculate, featuring strong transverse grooves and corrugations. The scutellum is broad and transverse. The elytra are nearly parallel along the sides and, in the female, are evenly covered with tomentum, except for the typical basal granules. Each elytron terminates in a bisinuate apex, with both outer angles forming distinct mucros. The underside of the body and the legs are clothed in tawny pubescence, lacking any lateral stripes. The antennae are about two-thirds longer than the body, smooth and unarmed, showing no signs of spines or roughness. Notably, the scape is free from any cicatrix, a feature that sets this species apart. The specimen described—like that in Thomson’s original account—is female, and the absence of the cicatrix on the scape is a defining trait. The total body length measures approximately 27 lines, or about 57 millimeters.

J. Thomson, Syst. Ceramb. p. 551
(?)B. White’i, Kaup, Einige Ceramb., tab. III, fig. 7
`,
      image: images.leonina,
      carouselImages: [
        images.leonina1,
        images.leonina2,
        images.leonina3,
        images.leonina4,
      ],
    },
    {
      id: 3,
      name: "Abatocera Luzonica",
      description: `Is a large and robust species of longhorn beetle belonging to the family Cerambycidae, endemic to the Philippines, particularly the island of Luzon an origin reflected in its specific epithet. This species is typically associated with forested habitats and exhibits xylophagous behavior, feeding on plant material such as tree bark and decaying wood. The adult beetle displays a stout, elongated body, with a generally brownish-gray dermal coloration marked by a speckled or mottled pattern that provides effective camouflage against tree trunks and bark. The elytra are hard and slightly textured, decorated with irregular light-colored patches or speckles that vary among individuals. Its antennae are extremely long, often extending well beyond twice the length of the body, a distinguishing feature of the genus. The legs are slender, finely pubescent, and adapted for climbing, providing strong grip on arboreal surfaces. The underside of the body is similarly pubescent and lacks distinctive lateral markings. Adult specimens typically measure between 50 and 70 mm in total length.

BioLib.cz.(https://www.biolib.cz/ en/taxon/id230894/). Retrieved on 8 September 2014.
`,
      image: magica,
      carouselImages: [
        images.luzonica1,
        images.luzonica2,
        images.luzonica3,
        images.luzonica4,
      ],
    },
    {
      id: 4,
      name: "Apriona Jirouxi",
      description: `Length: 49 mm.Elongated species, rather massive, concolorous verdigris to grayish-brown in color andslightly darker at the lateral margin of the elytra.Head: lower lobes of the eyes less wide than long. Antennae extending beyond the apex of the elytrain the male by almost a third and only about a fifth in the female. The articlesantennal are moderately fine and covered with a fine verdigris hair.Pronotum transverse, wrinkled, with an elongated horizontal gibbosity on either side of the pronotum, covered with a fine brown hair. Lateral spine conical, pointed with a few smalltubercles glabrous.Trapezoidal scutellum with an indentation, covered with the same hairiness as that covering theelytral disc. Elytra elongate, sub-cylindrical, the first fifth of which has tuberclesglabrous, particularly concentrated at the humeral angles. The humeral spine is markedand pointed; the apex of the convex elytra is extended by a slightly protruding sutural point.Underside unpunctate, covered with fine verdigris hairiness, marked on each side of the insect of a broad lateral band of white hairiness extending from the beginning of the pronotum to the penultimateabdominal segment and is absent from the last abdominal segment. Legs covered with a veryfine verdigris hair
 
Reference
Laurent T'JSDO (1) & Jean-Roch HOULLIER (2)
GILMOUR (E. F.), 1958. – Revision of the genus Apriona, Idea, 11 : 67-84, 104, 112-113, pl. 4-5,figs. 1, 6-9 and 12.JIROUX (E.), 2011. – Gender revision Apriona Chevrolat, 1852, The Cahiers MagellanesNS5 : 1-104
`,
      image: apriona,
      carouselImages: [
        images.jirouxi1,
        images.jirouxi2,
        images.jirouxi3,
        images.jirouxi4,
      ],
    },
    {
      id: 5,
      name: "Batocera Rubus",
      description: `Body lengthened, colour reddish brown to dark brownish, head small wider than longer, antennae as long as body length, their prothorax much broad than length, bispinose, convex anterior margin laterally, elytra dark red central disc with two semi-circular orange spots, more shiny of mid-dorsal part along sutral line, grey anteriorly, these are adorned with three yellow and four white spots, elytra highly notched. Batocera rubus Linnaeus 1785 (Coleoptera: Cerambycidae) is widely distributed beetle species  found in  China, India,  South Korea,  and many other countries (Liu  et al. 2003).  Due to their  large size  and long  life  cycle,  the damage  caused  by Batocera  rubus  to  trees  is often relatively  large. The larvae feed on the phloem and xylem of plants affecting their growth and leading to the loss of the affected branches, stems, and even the entire plant (Liu et al. 2003).


Agarwala, B. K., & Bhattacharjee, P. P. (2012). Long-horned beetles (Coleoptera: Cerambycidae) and tortoise beetles (Chrysomelidae: Cassidinae) of Tripura, northeastern India with some new additions. Journal of Threatened Taxa, 4(13), 3223–3227. https://doi.org/10.5555/20210159771_
`,
      image: rixator,
      carouselImages: [
        images.rubus1,
        images.rubus2,
        images.rubus3,
        images.rubus4,
      ],
    },
    {
      id: 6,
      name: "Batocera Victoriana",
      description: `BATOCERA VICTORIANA Thomson
Length: 62 mm; Width: 19 to 20 mm. Frons (forehead). General color of the elytra is a brown that is sometimes shiny; these are often covered, especially in the male, with a yellowish pubescence and numerous spots of the same color. (Female): Fifth and tenth antennal segments have convex outgrowths on the outside and concave on the inside; in the sixth, seventh, eighth, and ninth segments, this outgrowth is rudimentary; it no longer exists in the eleventh and twelfth segments. Two white spots are present on the cheeks, extending underneath the prothorax to the chest; two yellow spots are located on the top, in the middle. The scutellum is white. The base of the elytra features less pronounced granulations than in other species of the genus; the spots are very irregular, large, and take on more or less bizarre shapes depending on the individual. The sides of the thorax are white, with two large silky brown spots in the center. Abdomen is brown; legs are the same color, except the front legs, which are blackish.
Cerostema voluptuosa, Revue et Magasin de Zoologie, 1856, p. 529, 
Yoplophora (Cernsteniu) horsfieldii Hope, Transactions of the Entomological Society of London, vol. IV, 1845–47, p. 12, plate 1, figure 2.
Revue et Magasin de Zoologie, 1856, p. 529
`,
      image: victoriana,
      carouselImages: [
        images.victoriana1,
        images.victoriana2,
        images.victoriana3,
        images.victoriana4,
      ],
    },
    {
      id: 7,
      name: "Apriona Rixator",
      description: `The length of the antennae, (1.6-1.9 times for the male and 1.3-1.4 times for the female), Female: Length: 52-55 mm.Habitus of identical colouring.  Trapezoidal pronotum with an indentation. Antennas slightly protruding from the elytra.Ventral surface with a white band from the beginning of the pronotum to the penultimate one sternite and is absent from the last sternite. Its thorax is slightly wrinkled and the elytra are covered at the base with a very few large and distant granules , the humeral-tooth is very large but obtuse, the apex is provided with four blunt spines, and the undersurface shows a white band along the sides. 
(Notes from the Leyden Museum , "Vol. IX.).
`,
      image: rixator,
      carouselImages: [
        images.rixator1,
        images.rixator2,
        images.rixator3,
        images.rixator4,
      ],
    },
  ];

  // Filter insects based on the search query
  const filteredInsects = insectData.filter((insect) =>
    insect.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (insect) => {
    setSelectedInsect(insect);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedInsect(null);
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView>
        <View className="px-5 mb-14">
          {/* Search bar */}
          <Search onSearch={setSearchQuery} />
          <View className="my-5">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">
              Insect Information
            </Text>
            <View className="flex flex-col gap-2">
              {filteredInsects.map((insect) => (
                <TouchableOpacity
                  key={insect.id}
                  onPress={() => openModal(insect)}
                  className="bg-gray-50 p-4 rounded-xl flex-row items-center"
                >
                  <Image
                    source={insect.image}
                    className="w-12 h-full"
                    resizeMode="cover"
                  />
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-rubik-medium text-black-300">
                      {insect.name}
                    </Text>
                    <Text className="text-sm font-rubik text-black-100 mt-1 line-clamp-2">
                      {insect.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for Insect Details */}
      {selectedInsect && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-5 rounded-lg w-11/12">
              <FlatList
                data={selectedInsect.carouselImages}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Image
                    source={item}
                    className="w-64 h-64 mx-2 rounded-lg"
                    resizeMode="cover"
                  />
                )}
                showsHorizontalScrollIndicator={true}
              />
              <Text className="text-lg font-rubik-bold text-black-300 mt-4">
                {selectedInsect.name}
              </Text>
              <ScrollView className="max-h-40 mt-2">
                <Text className="text-sm font-rubik text-black-100 mt-2">
                  {selectedInsect.description}
                </Text>
              </ScrollView>
              <TouchableOpacity
                onPress={closeModal}
                className="mt-4 bg-blue-500 p-2 rounded"
              >
                <Text className="text-white text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
