import { StyleSheet, Text, View } from 'react-native';

export function BrandMark() {
  return <View style={styles.container}><Text style={styles.text}>FS</Text></View>;
}

const styles = StyleSheet.create({
  container: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#312E81', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  text: { color: '#A5B4FC', fontSize: 17, fontWeight: '800' },
});
