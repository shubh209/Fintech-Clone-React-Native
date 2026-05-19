import Colors from '@/shared/theme/colors';
import { defaultStyles } from '@/shared/theme/defaultStyles';
import { useAssets } from 'expo-asset';
import { ResizeMode, Video } from 'expo-av';
import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const highlights = [
  {
    label: 'Live market view',
    value: 'Track current crypto prices through the Cloudflare market API.',
  },
  {
    label: 'Simulation ready',
    value: 'Built for historical buy-date scenarios, current value, and future comparisons.',
  },
  {
    label: 'Data trust',
    value: 'Source and fallback states are part of the product, not hidden plumbing.',
  },
];

export function LandingScreen() {
  const [assets] = useAssets([require('@assets/videos/intro.mp4')]);

  return (
    <View style={styles.container}>
      {assets && (
        <Video
          resizeMode={ResizeMode.COVER}
          isMuted
          isLooping
          shouldPlay
          source={{ uri: assets[0].uri }}
          style={styles.video}
        />
      )}
      <View style={styles.scrim} />

      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Crypto Market Simulator</Text>
          <Text style={styles.header}>See what a past crypto buy would be worth today.</Text>
          <Text style={styles.description}>
            Explore live crypto market data now. Next, simulate historical purchases and compare
            today&apos;s value against real-world purchasing power.
          </Text>
        </View>

        <View style={styles.highlights}>
          {highlights.map((highlight) => (
            <View key={highlight.label} style={styles.highlightRow}>
              <View style={styles.highlightMarker} />
              <View style={styles.highlightText}>
                <Text style={styles.highlightLabel}>{highlight.label}</Text>
                <Text style={styles.highlightValue}>{highlight.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttons}>
          <Link href={'/signup'} style={[defaultStyles.pillButton, styles.primaryButton]} asChild>
            <TouchableOpacity>
              <Text style={defaultStyles.buttonText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
          <Link href={'/login'} style={[defaultStyles.pillButton, styles.secondaryButton]} asChild>
            <TouchableOpacity>
              <Text style={styles.secondaryButtonText}>Log in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 12, 18, 0.68)',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 84,
  },
  hero: {
    maxWidth: 620,
  },
  kicker: {
    color: '#C8F26A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  header: {
    fontSize: 40,
    fontWeight: '900',
    color: 'white',
    lineHeight: 46,
  },
  description: {
    color: '#E6E9EF',
    fontSize: 18,
    lineHeight: 26,
    marginTop: 18,
  },
  highlights: {
    gap: 16,
    marginTop: 48,
  },
  highlightRow: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  highlightMarker: {
    backgroundColor: '#C8F26A',
    borderRadius: 6,
    height: 12,
    marginTop: 5,
    width: 12,
  },
  highlightText: {
    flex: 1,
    gap: 4,
  },
  highlightLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  highlightValue: {
    color: '#D8DCE2',
    fontSize: 14,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flex: 1,
  },
  secondaryButtonText: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '700',
  },
});
