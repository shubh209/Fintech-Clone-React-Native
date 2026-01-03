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
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, useFont } from '@shopify/react-native-skia';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const categories = ['Overview', 'News', 'Orders', 'Transactions'];

type TickerPoint = {
  timestamp: number;
  price: number;
};

type CryptoInfo = {
  id: number;
  name: string;
  symbol: string;
  logo: string;
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

  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 12);

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
      const res = await fetch(`/api/info?ids=${id}`);
      if (!res.ok) throw new Error('Failed to fetch info');
      const data = await res.json();
      return data[id];
    },
  });

  const tickersQuery = useQuery<TickerPoint[]>({
    queryKey: ['tickers', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch('/api/tickers');
      if (!res.ok) throw new Error('Failed to fetch tickers');
      return res.json();
    },
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
      </View>
    );
  }

  const info = infoQuery.data;
  const tickers = tickersQuery.data ?? [];

  const animatedPrice = useAnimatedProps(() => ({
    text: `${state.y.price.value.value.toFixed(2)} €`,
    defaultValue: '',
  }));

  const animatedDate = useAnimatedProps(() => {
    const date = new Date(state.x.value.value);
    return { text: date.toLocaleDateString(), defaultValue: '' };
  });

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
        renderItem={() => (
          <View style={[defaultStyles.block, { height: 500 }]}>
            {tickers.length > 0 && (
              <>
                {!isActive ? (
                  <View>
                    <Text style={styles.price}>
                      {tickers[tickers.length - 1].price.toFixed(2)} €
                    </Text>
                    <Text style={styles.gray}>Today</Text>
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
            )}
          </View>
        )}
      />
    </>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default CryptoDetailScreen;
