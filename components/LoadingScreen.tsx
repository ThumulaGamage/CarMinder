import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text } from "react-native";

SplashScreen.preventAutoHideAsync(); // keep native splash until we hide it

export default function LoadingScreen({ onFinish }: { onFinish?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync(); // hide native splash
      onFinish?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#0a0f2c", "#001f54"]}
      style={styles.container}
    >
      <Image
        source={require("../assets/images/car_outline.png")}
        style={styles.carImage}
        resizeMode="contain"
      />

      <Text style={styles.appName}>CarMinder</Text>
      <Text style={styles.subtitle}>Keeping your vehicle compliant...</Text>

      <ActivityIndicator size="large" color="#42a5f5" style={{ marginTop: 24 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carImage: {
    width: 320,
    height: 200,
    marginBottom: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#a3c9ff",
  },
});
