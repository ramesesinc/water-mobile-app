import { View, Text, Modal, TouchableOpacity, Linking, StyleSheet } from "react-native";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.ramesesdevapps.etracswater";

const VersionCheckModal = ({ visible, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.message}>
            An updated version of this app is available. Make sure to coordinate with your admin before updating to enjoy the latest features and improved performance. 
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.update]}
              onPress={() =>
                Linking.openURL(
                  PLAY_STORE_URL // replace with your package name
                )
              }
            >
              <Text style={styles.updateText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  box: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancel: {
    // backgroundColor: "#007BFF",
    backgroundColor: "#f2f2f2" // strong primary
  },
  update: {
//    backgroundColor: "#f2f2f2", // almost white / bland
   backgroundColor: "#007BFF",
  },
  cancelText: {
    fontWeight: "bold",
  },
  updateText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default VersionCheckModal;