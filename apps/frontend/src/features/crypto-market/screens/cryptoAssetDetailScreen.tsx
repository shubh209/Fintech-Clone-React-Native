import { Stack, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { defaultStyles } from '@/shared/theme/defaultStyles';
import Colors from '@/shared/theme/colors';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, useFont } from '@shopify/react-native-skia';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { timeAsync } from '@/shared/metrics/metrics';
import { normalizeTickerPoints, ChartTickerPoint, TickerApiPoint } from '@/features/crypto-market/chart/normalizeTickerPoints';
import { formatEuroPrice } from '@/shared/formatting/formatEuroPrice';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const categories = ['Overview', 'Market', 'Chart', 'About'];

type CryptoInfo = {
  id: number;
  name: string;
  symbol: string;
  logo: string;
  description?: string;
};

const formatCompactEuro = (value?: number) => {
  if (!Number.isFinite(value)) return 'Unavailable';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value as number);
};

function ToolTip({
  x,
  y,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
}) {
  return <Circle cx={x} cy={y} r={8} color={Colors.primary} />;
}

const CryptoDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const headerHeight = useHeaderHeight();
  const [activeIndex, setActiveIndex] = useState(0);

  const font = useFont(require('@assets/fonts/SpaceMono-Regular.ttf'), 12);

  // ⚠️ DO NOT OVER-TYPE THIS — victory-native typings are wrong
  const chartPress = useChartPressState({
    x: 0,
    y: { price: 0 },
  }) as any;

  const { state, isActive } = chartPress;

  useEffect(() => {
    if (isActive) {
      Haptics.selectionAsync();
    }
  }, [isActive]);

  const infoQuery = useQuery<CryptoInfo>({
    queryKey: ['info', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Missing id');
      const res = await timeAsync(
        'crypto.client.detail_info.fetch',
        () => fetch(getCryptoApiUrl(`/api/info?ids=${id}`)),
        { endpoint: '/api/info', id }
      );
      if (!res.ok) throw new Error('Failed to fetch info');
      const data = await res.json();
      return data[id];
    },
  });

  const tickersQuery = useQuery<ChartTickerPoint[]>({
    queryKey: ['tickers', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await timeAsync(
        'crypto.client.tickers.fetch',
        () => fetch(getCryptoApiUrl(`/api/tickers?id=${id}`)),
        { endpoint: '/api/tickers', id: id ?? null }
      );
      if (!res.ok) throw new Error('Failed to fetch tickers');
      const data: TickerApiPoint[] = await res.json();
      return normalizeTickerPoints(data);
    },
  });

  const onRetry = () => {
    infoQuery.refetch();
    tickersQuery.refetch();
  };

  const animatedPrice = useAnimatedProps(() => ({
    text: `${state.y.price.value.value.toFixed(2)} €`,
    defaultValue: '',
  }));

  const animatedDate = useAnimatedProps(() => {
    const date = new Date(state.x.value.value);
    return { text: date.toLocaleDateString(), defaultValue: '' };
  });

  if (infoQuery.isLoading || tickersQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (infoQuery.isError || tickersQuery.isError || !infoQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.gray }}>Failed to load crypto data.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const info = infoQuery.data;
  const tickers = tickersQuery.data ?? [];
  const latestTicker = tickers[tickers.length - 1];
  const latestUpdatedAt = latestTicker
    ? new Date(latestTicker.timestamp).toLocaleString()
    : 'Unavailable';

  return (
    <>
      <Stack.Screen options={{ title: info.name }} />

      <SectionList
        style={{ marginTop: headerHeight }}
        keyExtractor={(item) => item.title}
        sections={[{ data: [{ title: 'Chart' }] }]}
        renderSectionHeader={() => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((item, index) => (
              <TouchableOpacity
                key={item}
                onPress={() => setActiveIndex(index)}
                style={
                  activeIndex === index
                    ? styles.categoriesBtnActive
                    : styles.categoriesBtn
                }
              >
                <Text
                  style={
                    activeIndex === index
                      ? styles.categoryTextActive
                      : styles.categoryText
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.subtitle}>{info.symbol}</Text>
            <Image source={{ uri: info.logo }} style={{ width: 60, height: 60 }} />
          </View>
        )}
        renderItem={() => {
          if (!latestTicker) {
            return (
              <View style={styles.panel}>
                <Text style={styles.gray}>No live market data is available for this asset.</Text>
              </View>
            );
          }

          if (activeIndex === 0) {
            return (
              <View style={styles.panel}>
                <Text style={styles.panelLabel}>Latest price</Text>
                <Text style={styles.price}>{formatEuroPrice(latestTicker.price)}</Text>
                <Text style={styles.gray}>Data source: CoinMarketCap</Text>
                <Text style={styles.gray}>Last updated: {latestUpdatedAt}</Text>

                <View style={styles.marketGrid}>
                  <View style={styles.marketTile}>
                    <Text style={styles.marketLabel}>24h volume</Text>
                    <Text style={styles.marketValue}>{formatCompactEuro(latestTicker.volume_24h)}</Text>
                  </View>
                  <View style={styles.marketTile}>
                    <Text style={styles.marketLabel}>Market cap</Text>
                    <Text style={styles.marketValue}>{formatCompactEuro(latestTicker.market_cap)}</Text>
                  </View>
                </View>
              </View>
            );
          }

          if (activeIndex === 1) {
            return (
              <View style={styles.panel}>
                <Text style={styles.panelLabel}>Market snapshot</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Price</Text>
                  <Text style={styles.metricValue}>{formatEuroPrice(latestTicker.price)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>24h volume</Text>
                  <Text style={styles.metricValue}>{formatCompactEuro(latestTicker.volume_24h)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Market cap</Text>
                  <Text style={styles.metricValue}>{formatCompactEuro(latestTicker.market_cap)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Source</Text>
                  <Text style={styles.metricValue}>CoinMarketCap</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Data source</Text>
                  <Text style={styles.metricValue}>CoinMarketCap</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Last updated</Text>
                  <Text style={styles.metricValue}>{latestUpdatedAt}</Text>
                </View>
              </View>
            );
          }

          if (activeIndex === 2) {
            return (
              <View style={styles.chartPanel}>
                {tickers.length > 1 ? (
                  <>
                    {!isActive ? (
                      <View>
                        <Text style={styles.price}>
                          {formatEuroPrice(latestTicker.price)}
                        </Text>
                        <Text style={styles.gray}>Last updated: {latestUpdatedAt}</Text>
                      </View>
                    ) : (
                      <View>
                        <AnimatedTextInput
                          editable={false}
                          style={styles.price}
                          animatedProps={animatedPrice}
                        />
                        <AnimatedTextInput
                          editable={false}
                          style={styles.gray}
                          animatedProps={animatedDate}
                        />
                      </View>
                    )}

                    <CartesianChart
                      chartPressState={state}
                      data={tickers}
                      xKey="timestamp"
                      yKeys={['price']}
                      axisOptions={{
                        font,
                        tickCount: 5,
                        labelColor: Colors.gray,
                        formatYLabel: (v) => `${v} €`,
                        formatXLabel: (ms) => format(new Date(ms), 'MM/yy'),
                      }}
                    >
                      {({ points }: any) => (
                        <>
                          <Line
                            points={points.price}
                            color={Colors.primary}
                            strokeWidth={3}
                          />
                          {isActive && (
                            <ToolTip
                              x={state.x.position}
                              y={state.y.price.position}
                            />
                          )}
                        </>
                      )}
                    </CartesianChart>
                  </>
                ) : (
                  <View style={styles.livePriceOnly}>
                    <Text style={styles.panelLabel}>Live quote</Text>
                    <Text style={styles.price}>{formatEuroPrice(latestTicker.price)}</Text>
                    <Text style={styles.gray}>
                      Historical chart data is not available from the current quote API response.
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          return (
            <View style={styles.panel}>
              <Text style={styles.panelLabel}>About {info.name}</Text>
              <Text style={styles.description}>
                {info.description || 'No description is available for this asset.'}
              </Text>
            </View>
          );
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray,
  },
  price: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  gray: {
    fontSize: 18,
    color: Colors.gray,
  },
  categoriesBtn: {
    padding: 10,
    borderRadius: 20,
  },
  categoriesBtnActive: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    color: Colors.gray,
  },
  categoryTextActive: {
    fontSize: 14,
    color: '#000',
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  panel: {
    ...defaultStyles.block,
    gap: 16,
  },
  chartPanel: {
    ...defaultStyles.block,
    height: 500,
  },
  panelLabel: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '700',
  },
  marketGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  marketTile: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
  },
  marketLabel: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  marketValue: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 12,
  },
  metricLabel: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  metricValue: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  livePriceOnly: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  description: {
    color: Colors.dark,
    fontSize: 15,
    lineHeight: 22,
  },
});

export default CryptoDetailScreen;
